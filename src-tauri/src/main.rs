#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{path::PathBuf, time::Duration};
use tauri::Manager;

#[derive(Debug, Serialize)]
struct AppError { code: &'static str, message: String, retryable: bool }
impl AppError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self { code, message: message.into(), retryable: false }
    }
}
struct Store(PathBuf);

fn connect(path: &std::path::Path) -> Result<Connection, AppError> {
    let db = Connection::open(path).map_err(|e| AppError::new("DATABASE", e.to_string()))?;
    db.busy_timeout(Duration::from_secs(5)).map_err(|e| AppError::new("DATABASE", e.to_string()))?;
    db.execute_batch("PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS records (namespace TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL,
        PRIMARY KEY(namespace,id)); PRAGMA user_version=1;")
        .map_err(|e| AppError::new("MIGRATION", e.to_string()))?;
    Ok(db)
}

fn valid_record(namespace: &str, id: &str, payload: &Value) -> Result<(), AppError> {
    if !["reviews", "snapshots"].contains(&namespace) || id.is_empty() || id.len() > 120 {
        return Err(AppError::new("INVALID_INPUT", "Invalid record namespace or ID"));
    }
    if !payload.is_object() || payload.to_string().len() > 10_000_000 {
        return Err(AppError::new("INVALID_INPUT", "Expected an object under 10 MB"));
    }
    if namespace == "reviews" {
        let note = payload.get("note").and_then(Value::as_str).ok_or_else(|| AppError::new("INVALID_INPUT", "Missing note"))?;
        let stage = payload.get("stage").and_then(Value::as_str).unwrap_or("");
        let evidence = payload.get("evidence").and_then(Value::as_str).unwrap_or("");
        if note.len() > 40000 || !["Research", "Awaiting response", "Adopted", "Closed"].contains(&stage)
            || payload.get("id").and_then(Value::as_str) != Some(id)
            || (stage == "Adopted" && evidence.is_empty())
            || (!evidence.is_empty() && !url::Url::parse(evidence).map(|u| u.scheme() == "https" && u.host_str().is_some()).unwrap_or(false)) {
            return Err(AppError::new("INVALID_INPUT", "Invalid review fields"));
        }
    } else if !payload.get("rows").map(Value::is_array).unwrap_or(false)
        || payload.get("schemaVersion").and_then(Value::as_u64) != Some(1) {
        return Err(AppError::new("INVALID_INPUT", "Invalid snapshot"));
    }
    Ok(())
}

#[tauri::command]
fn save_record(store: tauri::State<Store>, namespace: String, id: String, payload: Value) -> Result<(), AppError> {
    valid_record(&namespace, &id, &payload)?;
    let db = connect(&store.0)?;
    db.execute("INSERT INTO records(namespace,id,payload) VALUES (?1,?2,?3)
        ON CONFLICT(namespace,id) DO UPDATE SET payload=excluded.payload", params![namespace,id,payload.to_string()])
        .map_err(|e| AppError::new("DATABASE", e.to_string()))?;
    Ok(())
}

#[tauri::command]
fn load_records(store: tauri::State<Store>, namespace: String) -> Result<Vec<Value>, AppError> {
    if !["reviews", "snapshots"].contains(&namespace.as_str()) {
        return Err(AppError::new("INVALID_INPUT", "Unknown namespace"));
    }
    let db = connect(&store.0)?;
    let mut stmt = db.prepare("SELECT payload FROM records WHERE namespace=?1 ORDER BY id")
        .map_err(|e| AppError::new("DATABASE", e.to_string()))?;
    let mapped = stmt.query_map([namespace], |r| r.get::<_, String>(0))
        .map_err(|e| AppError::new("DATABASE", e.to_string()))?;
    let mut records = Vec::new();
    for row in mapped {
        let text = row.map_err(|e| AppError::new("DATABASE", e.to_string()))?;
        records.push(serde_json::from_str(&text).map_err(|e| AppError::new("CORRUPT_RECORD", e.to_string()))?);
    }
    Ok(records)
}

fn launch_document(target: &str) -> Result<(), AppError> {
    #[cfg(target_os="windows")]
    let result = std::process::Command::new("rundll32.exe").args(["url.dll,FileProtocolHandler",target]).spawn();
    #[cfg(target_os="macos")]
    let result = std::process::Command::new("open").arg(target).spawn();
    #[cfg(not(any(target_os="windows",target_os="macos")))]
    let result = std::process::Command::new("xdg-open").arg(target).spawn();
    result.map_err(|e|AppError::new("OPEN_FAILED",e.to_string()))?;
    Ok(())
}

#[tauri::command]
fn open_source(url: String) -> Result<(), AppError> {
    let parsed=url::Url::parse(&url).map_err(|_|AppError::new("INVALID_URL","Invalid source URL"))?;
    if parsed.scheme()!="https" || parsed.host_str().is_none() || !parsed.username().is_empty() || parsed.password().is_some() {
        return Err(AppError::new("INVALID_URL","Only HTTPS source URLs without credentials can be opened"));
    }
    launch_document(parsed.as_str())
}

#[tauri::command]
fn open_report(store:tauri::State<Store>,name:String) -> Result<(),AppError> {
    let content=match name.as_str(){
        "fiscal-impact-report"=>include_str!("../../public/reports/fiscal-impact-report.html"),
        "policy-brief"=>include_str!("../../public/reports/policy-brief.html"),
        _=>return Err(AppError::new("INVALID_INPUT","Unknown bundled report"))
    };
    let parent=store.0.parent().ok_or_else(||AppError::new("PATH","App data directory unavailable"))?;
    let folder=parent.join("reports");std::fs::create_dir_all(&folder).map_err(|e|AppError::new("IO",e.to_string()))?;
    for (filename,text) in [("fiscal-impact-report.html",include_str!("../../public/reports/fiscal-impact-report.html")),
        ("policy-brief.html",include_str!("../../public/reports/policy-brief.html")),
        ("report.css",include_str!("../../public/reports/report.css"))] {
        std::fs::write(folder.join(filename),text).map_err(|e|AppError::new("IO",e.to_string()))?;
    }
    let path=folder.join(format!("{name}.html"));
    std::fs::write(&path,content).map_err(|e|AppError::new("IO",e.to_string()))?;
    launch_document(path.to_str().ok_or_else(||AppError::new("PATH","Invalid report path"))?)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchRequest { source: String, year: u16, kind: String }

#[tauri::command]
async fn fetch_public_data(request: FetchRequest) -> Result<Value, AppError> {
    if !(2020..=2100).contains(&request.year) || !["contract", "grant"].contains(&request.kind.as_str()) {
        return Err(AppError::new("INVALID_INPUT", "Invalid fiscal year or award type"));
    }
    let client = reqwest::Client::builder().timeout(Duration::from_secs(60))
        .redirect(reqwest::redirect::Policy::none()).user_agent("Magnexis-FiscalWatch/0.1")
        .build().map_err(|e| AppError::new("NETWORK", e.to_string()))?;
    let response = match request.source.as_str() {
        "ct" => client.get("https://data.ct.gov/resource/ajdm-rvz7.json")
            .query(&[("$where", format!("fiscal_year={}",request.year)), ("$limit", "1000".into()),
              ("$order", "payment_date DESC,payment_id,invoice_id,invoice_line_number,invoice_line_distribution_number,account,fund_code".into())]).send().await,
        "usaspending" => {
            let codes = if request.kind == "grant" { vec!["02","03","04","05"] } else { vec!["A","B","C","D"] };
            client.post("https://api.usaspending.gov/api/v2/search/spending_by_award/").json(&serde_json::json!({
                "filters":{"award_type_codes":codes,"time_period":[{"start_date":format!("{}-10-01",request.year-1),"end_date":format!("{}-09-30",request.year)}],
                  "place_of_performance_locations":[{"country":"USA","state":"CT"}]},
                "fields":["Award ID","Recipient Name","Recipient UEI","Award Amount","Awarding Agency","Base Obligation Date","Start Date","Description","generated_internal_id"],
                "limit":100,"page":1,"sort":"Award Amount","order":"desc"
            })).send().await
        },
        _ => return Err(AppError::new("INVALID_INPUT", "Unknown public source"))
    }.map_err(|e| AppError { code:"NETWORK",message:format!("Public source unavailable: {e}. Cached data remains available."),retryable:true })?;
    let mut response = response.error_for_status().map_err(|e| AppError::new("UPSTREAM_HTTP", e.to_string()))?;
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| AppError::new("NETWORK",e.to_string()))? {
        if bytes.len()+chunk.len()>20_000_000 { return Err(AppError::new("RESPONSE_TOO_LARGE", "Response exceeds 20 MB")); }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map_err(|e| AppError::new("UPSTREAM_SCHEMA", e.to_string()))
}

fn main() {
    tauri::Builder::default().setup(|app| {
        let directory = app.path().app_local_data_dir()?;
        std::fs::create_dir_all(&directory)?;
        let path = directory.join("fiscalwatch.sqlite3");
        connect(&path).map_err(|e| std::io::Error::other(e.message))?;
        app.manage(Store(path)); Ok(())
    }).invoke_handler(tauri::generate_handler![save_record,load_records,fetch_public_data,open_source,open_report])
        .run(tauri::generate_context!()).expect("FiscalWatch desktop runtime failed");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn rejects_untrusted_namespace_and_non_https_evidence() {
        assert!(valid_record("../../file", "a", &serde_json::json!({})).is_err());
        assert!(valid_record("reviews", "a", &serde_json::json!({"id":"a","note":"x","stage":"Research","evidence":"javascript:alert(1)"})).is_err());
    }
    #[test] fn invalid_queries_and_file_urls_are_rejected() {
        assert!(tauri::async_runtime::block_on(fetch_public_data(FetchRequest{source:"ct".into(),year:1,kind:"contract".into()})).is_err());
        assert!(open_source("file:///C:/Windows/system.ini".into()).is_err());
        assert!(open_source("https://user:password@example.com".into()).is_err());
        assert!(valid_record("reviews","a",&serde_json::json!({"id":"a","note":"x","stage":"Adopted","evidence":""})).is_err());
    }
    #[test]
    #[ignore = "Requires live public network; run explicitly for connector smoke validation"]
    fn live_public_connectors() {
        for (source,kind) in [("ct","contract"),("usaspending","contract"),("usaspending","grant")] {
            let result=tauri::async_runtime::block_on(fetch_public_data(FetchRequest{source:source.into(),year:2026,kind:kind.into()})).unwrap();
            let rows=if source=="ct" {result.as_array().unwrap()} else {result["results"].as_array().unwrap()};
            assert!(!rows.is_empty());
            println!("{source}/{kind}: {} real records received",rows.len());
        }
    }
    #[test] fn sqlite_upsert_and_reopen_preserves_review() {
        let path = std::env::temp_dir().join(format!("fiscalwatch-test-{}.db",std::process::id()));
        { let db=connect(&path).unwrap();
          db.execute("INSERT OR REPLACE INTO records VALUES ('reviews','test','{\"note\":\"saved\"}')",[]).unwrap(); }
        let db=connect(&path).unwrap();
        let text:String=db.query_row("SELECT payload FROM records WHERE id='test'",[],|r|r.get(0)).unwrap();
        assert!(text.contains("saved")); drop(db); std::fs::remove_file(path).unwrap();
    }
}
