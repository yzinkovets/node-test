```
time clickhouse --client --max_partitions_per_insert_block 1000 --query="INSERT INTO wizeflow.tracks FORMAT CSVWithNames" < /host/2025.csv
```


```
/*
drop table __kafka__wizeflow_tracks__mv;
drop table __kafka__wizeflow_tracks;
drop table tracks;
*/

CREATE TABLE wizeflow.tracks (
    dt DateTime,
    ms UInt32,
    timezone Nullable(Int16),
    session_id Nullable(String), 
    document_id Nullable(String), 
    document_uuid Nullable(String),
    content_id Nullable(String),
    organization_id Nullable(String),
    project_id Nullable(String),
    member_id Nullable(String),
    user Nullable(String),
    email Nullable(String),
    fp Nullable(String),
    action Nullable(String),
    duration Nullable(UInt32),
    page Nullable(UInt32),
    page_id Nullable(UInt32),
    asset_id Nullable(UInt32),
    browser_major Nullable(String),
    browser_name Nullable(String),
    browser_version Nullable(String),
    cpu_architecture Nullable(String),
    device_model Nullable(String),
    device_type Nullable(String),
    device_vendor Nullable(String),
    engine_name Nullable(String),
    engine_version Nullable(String),
    ip Nullable(String),
    lat Nullable(Float32),
    lon Nullable(Float32),
    online Nullable(UInt8),
    os_name Nullable(String),
    os_version Nullable(String),
    ua Nullable(String),
    old_stats_id Nullable(String)
)
ENGINE = MergeTree() 
PARTITION BY toDate(dt)
ORDER BY (dt, ms) 
SETTINGS index_granularity = 8192;

CREATE TABLE __kafka__wizeflow_tracks AS tracks ENGINE = Kafka()
SETTINGS 
kafka_broker_list='kafka1:19092',
kafka_topic_list = 'wizeflow.tracks',
kafka_group_name = 'ch.wizeflow.tracks',
kafka_format = 'JSONEachRow',
kafka_skip_broken_messages = 1;

CREATE MATERIALIZED VIEW __kafka__wizeflow_tracks__mv TO tracks AS SELECT * FROM __kafka__wizeflow_tracks;

```