# Data-source catalogue — harvested

677 data sources from the same apps. `context` = the connector action that runs. Any action in the workflow-builder
catalogue can back a data source; add `context.connectionId` for connectors that need a connection.

## Connector actions in use

- `callables/callables_call_automation` — 2813
- `storage_by_unifyapps/storage_by_unifyapps_fetch_records` — 2047
- `storage_by_unifyapps/storage_by_unifyapps_update_records` — 415
- `analytics_by_unifyapps/analytics_by_unifyapps_query_reports` — 192
- `storage_by_unifyapps/storage_by_unifyapps_get_record_by_id` — 151
- `storage_by_unifyapps/storage_by_unifyapps_create_record` — 133
- `storage_by_unifyapps/storage_by_unifyapps_count_records` — 67
- `storage_by_unifyapps/storage_by_unifyapps_aggregate_metadata` — 62
- `analytics_by_unifyapps/analytics_by_unifyapps_execute_query` — 60
- `storage_by_unifyapps/storage_by_unifyapps_update_record_fields_by_id` — 50
- `storage_by_unifyapps/storage_by_unifyapps_update_record_by_id` — 47
- `auth_by_unifyapps/auth_by_unifyapps_login` — 46
- `code_by_unifyapps/code_by_unifyapps_groovy` — 46
- `callables/undefined` — 41
- `storage_by_unifyapps/storage_by_unifyapps_delete_record_by_id` — 34
- `storage_by_unifyapps/undefined` — 32
- `storage_by_unifyapps/storage_by_unifyapps_delete_records` — 31
- `standard_entities/standard_entities_update_space` — 16
- `standard_entities/standard_entities_fetch_entities` — 15
- `auth_by_unifyapps/auth_by_unifyapps_fetch_identity_providers` — 13
- `standard_entities/standard_entities_update_user` — 7
- `storage_by_unifyapps/storage_by_unifyapps_upsert_record` — 6
- `notification_by_unifyapps/notification_by_unifyapps_fetch_unread_notifications` — 5
- `analytics_by_unifyapps/undefined` — 5
- `standard_entities/standard_entities_fetch_user` — 5
- `storage_by_unifyapps/storage_by_unifyapps_fetch_distinct_values` — 5
- `gmail/gmail_send_email` — 4
- `auth_by_unifyapps/auth_by_unifyapps_verify_mfa` — 4
- `auth_by_unifyapps/auth_by_unifyapps_re_trigger_mfa` — 4
- `custom_http_endpoint/custom_http_endpoint_execute` — 3
- `conv_ai_by_unifyapps/conv_ai_by_unifyapps_publish_response` — 3
- `code_by_unifyapps/code_by_unifyapps_python` — 3
- `storage_by_unifyapps/storage_by_unifyapps_bulk_create_records` — 3
- `notification_by_unifyapps/notification_by_unifyapps_fetch_notifications` — 3
- `analytics_by_unifyapps/analytics_by_unifyapps_aggregate_metadata` — 3
- `standard_entities/standard_entities_reset_password` — 3
- `audit_by_unifyapps/audit_by_unifyapps_get_audit_records_for_asset` — 3
- `utility_by_unifyapps/utility_by_unifyapps_generate_public_url` — 3
- `6824756fc286127c2ccfa630/undefined` — 3
- `formbuilder_123/formbuilder_123_create_form` — 2
- `gdrive/gdrive_export_file` — 2
- `openai/openai_send_message` — 2
- `routines_by_unifyapps/routines_by_unifyapps_list_routine_runs` — 2
- `standard_entities/standard_entities_get_latest_app_release` — 2
- `routines_by_unifyapps/routines_by_unifyapps_delete_routine` — 2
- `standard_entities/standard_entities_disable_connection` — 2
- `standard_entities/standard_entities_deploy_entity` — 2
- `68abf64a60d6bf723672f510/undefined` — 2
- `code_by_unifyapps/code_by_unifyapps_javascript` — 2
- `utility_by_unifyapps/utility_by_unifyapps_to_json_object` — 2
- `callables/callables_call_automation_streaming` — 2
- `gmail/undefined` — 1
- `databricks/undefined` — 1
- `servicenow/undefined` — 1
- `sendgrid/undefined` — 1
- `notification_by_unifyapps/notification_by_unifyapps_delete_notification` — 1
- `notification_by_unifyapps/notification_by_unifyapps_delete_all` — 1
- `notification_by_unifyapps/notification_by_unifyapps_mark_notification_as_read` — 1
- `standard_entities/standard_entities_fetch_connection_schema` — 1
- `standard_entities/standard_entities_get_connection_details` — 1
- `storage_by_unifyapps/storage_by_unifyapps_export_records` — 1
- `platform_by_unifyapps/platform_by_unifyapps_get_api_schema` — 1
- `auth_by_unifyapps/auth_by_unifyapps_trigger_reset_password` — 1
- `6824772f0327765d1bc6d1b4/undefined` — 1
- `notification_by_unifyapps/notification_by_unifyapps_send_notification` — 1
- `pdf_by_unifyapps/pdf_by_unifyapps_add_signature` — 1
- `analytics_by_unifyapps/analytics_by_unifyapps_execute_update` — 1
- `oracle/undefined` — 1
- `sap_successfactors/sap_successfactors_fetch_leave_details_of_employee` — 1
- `microsoft_dynamics365/microsoft_dynamics365_get_object_by_id` — 1
- `code_by_unifyapps/undefined` — 1
- `amazon_s3/undefined` — 1
- `custom_http_endpoint/undefined` — 1

## advancedOptions seen (most common first)

- 2710× `{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"}`
- 2305× `{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"}`
- 241× `{"runBehaviour":"manual","retryEnabled":false,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}}`
- 184× `{"retryDelay":1500,"retryEnabled":true,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":true,"runQueryPeriodically":false},"retryCount":1,"runBehaviour":"automatic","retryBackoffFactor":2}`
- 104× `{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}}`
- 102× `{"runBehaviour":"manual"}`
- 88× `{"runBehaviour":"manual","retryEnabled":false,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":true,"runQueryPeriodically":false}}`
- 60× `{"retryDelay":1500,"retryEnabled":true,"refetchOnWindowFocus":false,"timing":{"runQueryOnPageLoad":true,"runQueryPeriodically":false},"retryCount":1,"runBehaviour":"automatic","retryBackoffFactor":2}`

## One real data source per connector action

### `callables/callables_call_automation`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"var_Fw0Oj","p":["var_Fw0Oj['value']"]}],"advancedOptions":{"runBehaviour":"manual","retryEnabled":false,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}},"inputs":{"automationId":"6a778689ac715b775bd97647","runtimeConnections":{},"parameters":{"aiAgentId":"{{ var_Fw0Oj['value'] }}"},"synchronous":true},"name":"createArtifact","context":{"appName":"callables","resourceName":"callables_call_automation","resourceVersion":2541},"options":{"cacheConfig":{}},"callbacks":{"successEvents":[{"action":{"actionType":"navigateToPage","executionType":"delay","id":"act_N00sJ","payload":{"pageId":"e_6a230dcb7529013ce0711d11","target":"_self","pageInputs":{"initialChatId":"{{ e_6ab28b89eb94a260d50342b9['data']['caseId'] }}"},"history":"push","overridePageAnimation":false}},"id":"evt_btdpo","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","dP":[{"p":"inputs.parameters.aiAgentId"}],"interfacePageId":"e_6ab28b89eb94a260d50342b7"}
```

### `storage_by_unifyapps/storage_by_unifyapps_fetch_records`
```json
{"metadata":{"isManuallyRenamed":false},"dpOn":[{"id":"pageInputs","p":["pageInputs['uniqueName']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"triggerInputCondition":{"filters":[{"property":"properties_uniqueName","filter":{"operator":"EQUAL","value":"{{ pageInputs['uniqueName'] }}"}}],"operator":"AND"},"shouldSearchInAnalyticsStore":false,"object_type":"e_artifact_detail","includeRoleMappings":false,"includeCurrentUserPermissions":true,"translationsOption":"DEFAULT","page":{"paginateBy":"OFFSET","limit":20},"readThroughSessionVariables":false,"numberOfRecordsToFetch":"SINGLE","includeTotalCount":false,"fields":[],"fetchDeployedEntity":false},"name":"fetchRecordsArtifactDetails","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_fetch_records","resourceVersion":13289},"callbacks":{"successEvents":[{"action":{"actionType":"setPageVariable","executionType":"delay","id":"act_qRNtU","payload":{"variableId":"var_Dq2P0","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ e_6ab2b401da8f871e79e22c92['data']['id'] ? 'accessible': 'inaccessible'}}"}}},"id":"evt_KxcQY","eventType":"onSuccess"},{"action":{"actionType":"navigateToPage","executionType":"delay","id":"act_idqrk","payload":{"pageId":"e_6a230dcb7529013ce0711d11","target":"_self","pageInputs":{"initialChatMessage":"","isArtifactPreview":true,"initialChatId":"{{ e_6ab2b401da8f871e79e22c92['data']['properties']['caseId'] }}"},"history":"push","overridePageAnimation":false},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ e_6ab2b401da8f871e79e22c92['data']['properties']['caseId'] }}","filter":{"operator":"EXISTS"}},{"property":"EDIT","filter":{"operator":"IN","value":"{{ e_6ab2b401da8f871e79e22c92['data']['currentUserPermissions'] }}"}}],"operator":"AND"}}},"id":"evt_CJzCW","eventType":"onSuccess","disabled":true},{"action":{"actionType":"setPageVariable","executionType":"delay","id":"act_VTbZy","payload":{"variableId":"var_E9FaV","method":"setPageVariable","operationDetails":{"operation":"SET","value":"true"}},"runCondition":{"type":" …(trimmed)
```

### `storage_by_unifyapps/storage_by_unifyapps_update_records`
```json
{"dpOn":[{"p":["b_4uts3['data']['F_VHgMm']"],"id":"b_4uts3"}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"numberOfRecordsToUpdate":"SINGLE","skipIfEmpty":false,"sortBy":[],"page":{"offset":0,"limit":20},"object_type":"nso_escalation_logs","updateFields":[{"actionType":"SET","fieldName":"properties.tentative_sod_date","setValue":"{{ b_4uts3['data']['F_VHgMm'] }}"}]},"name":"Update SOD - Escalation Log","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_update_records","resourceVersion":44},"type":"APPLICATION","dp":[{"p":"inputs.updateFields[0].setValue"}],"interfacePageId":"e_67f7b3b9e85a9306cd6c00c7"}
```

### `analytics_by_unifyapps/analytics_by_unifyapps_query_reports`
```json
{"dpOn":[{"p":["b_COB9V['data']['F_YvEnK']"],"id":"b_COB9V"}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"projections":[{"name":"ENTITY_nso_store_mapping=::=city","includePercentageChange":false,"aggregationFunction":"GROUP"},{"name":"ENTITY_nso_store_mapping=::=city","includePercentageChange":false,"alias":"count","aggregationFunction":"COUNT"}],"filter":{"filters":[{"filter":{"value":"{{ b_COB9V['data']['F_YvEnK'] }}","operator":"EQUAL"},"property":"ENTITY_nso_store_mapping=::=state"}],"operator":"AND"},"searchField":{"fields":[]},"entityType":"ENTITY_nso_store_mapping","page":{"limit":1000},"sorts":[],"group":"ENTITY_REPORTING","additionalProjections":[]},"name":"City List - 2","context":{"appName":"analytics_by_unifyapps","resourceName":"analytics_by_unifyapps_query_reports","resourceVersion":45},"type":"APPLICATION","dp":[{"p":"inputs.filter.filters[0].filter.value"}],"interfacePageId":"e_67ce83e6c9f68f0248a0682d"}
```

### `storage_by_unifyapps/storage_by_unifyapps_get_record_by_id`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"userContext","p":["userContext['id']"]}],"outputSchema":{"type":"object","properties":{"instructions":{"type":"string"},"fullName":{"type":"string"},"alias":{"type":"string"},"userId":{"type":"string"}}},"advancedOptions":{"runBehaviour":"automatic","retryEnabled":false,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":true,"runQueryPeriodically":false}},"inputs":{"includeCurrentUserPermissions":false,"translationsOption":"DEFAULT","id":"{{ userContext['id'] }}","readThroughSessionVariables":false,"object_type":"ai_agent_user_setting","includeRoleMappings":false},"callbacks":{"successEvents":[],"failureEvents":[]},"type":"APPLICATION","dP":[{"p":"inputs.id"}],"target":"app","name":"fetchProfile","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_get_record_by_id","resourceVersion":13199},"options":{"transformerConfig":{"enabled":true,"includeOriginalOutput":true,"inputs":{"code":"const userDetails = data?.properties;\nconst fallbackName = {{ userContext['name'] }};\nreturn {\n  \"instructions\": userDetails?.instructions ?? \"\",\n  \"fullName\": userDetails?.fullName || fallbackName,\n  \"alias\": userDetails?.alias || fallbackName,\n  \"userId\": userDetails?.userId\n};","compile_static":false},"context":{"type":"APPLICATION","appName":"code_by_unifyapps","resourceName":"code_by_unifyapps_javascript"},"fallbackMode":"FAIL","id":"transformer","type":"javascript"},"cacheConfig":{}},"interfaceId":"ua-enterprise-chat","interfacePageId":"e_global_ua-enterprise-chat"}
```

### `storage_by_unifyapps/storage_by_unifyapps_create_record`
```json
{"dpOn":[{"p":["b_ydphQ['files'][0]['temporaryUrl']","b_ydphQ['files'][0]['key']","b_ydphQ['files'][0]['mimeType']","b_ydphQ['files'][0]['url']","b_ydphQ['files'][0]['size']","b_ydphQ['files'][0]['name']","b_ydphQ['files'][0]['progress']","b_ydphQ['files'][0]['id']","b_ydphQ['files'][0]['fileType']"],"id":"b_ydphQ"}],"advancedOptions":{"runBehaviour":"manual","retryEnabled":false,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}},"inputs":{"writeThroughSessionVariables":false,"object_type":"bupa_documents","record":{"fileObject":{"temporaryUrl":"{{ b_ydphQ['files'][0]['temporaryUrl'] }}","source":"{{ b_ydphQ['files'][0]['key'] }}","mimeType":"{{ b_ydphQ['files'][0]['mimeType'] }}","type":"{{ b_ydphQ['files'][0]['mimeType'] }}","url":"{{ b_ydphQ['files'][0]['url'] }}","size":"{{ b_ydphQ['files'][0]['size'] }}","sourceType":"CLOUD_STORAGE","name":"{{ b_ydphQ['files'][0]['name'] }}","progress":"{{ b_ydphQ['files'][0]['progress'] }}","isUploaded":true,"id":"{{ b_ydphQ['files'][0]['id'] }}","fileType":"{{ b_ydphQ['files'][0]['fileType'] }}","key":"{{ b_ydphQ['files'][0]['key'] }}"},"s3TempUrl":"{{ b_ydphQ['files'][0]['temporaryUrl'] }}","mimeType":"application/pdf","referenceId":"e_6880c0cf6767a5520ab42930"}},"name":"dataSource1","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_create_record","resourceVersion":96},"options":{"cacheConfig":{}},"type":"APPLICATION","dP":[{"p":"inputs.record.fileObject.temporaryUrl"},{"p":"inputs.record.fileObject.source"},{"p":"inputs.record.fileObject.mimeType"},{"p":"inputs.record.fileObject.type"},{"p":"inputs.record.fileObject.url"},{"p":"inputs.record.fileObject.size"},{"p":"inputs.record.fileObject.name"},{"p":"inputs.record.fileObject.progress"},{"p":"inputs.record.fileObject.id"},{"p":"inputs.record.fileObject.fileType"},{"p":"inputs.record.fileObject.key"},{"p":"inputs.record.s3TempUrl"}],"interfacePageId":"e_69e5f69b4f9da80626c2fa30"}
```

### `storage_by_unifyapps/storage_by_unifyapps_count_records`
```json
{"dpOn":[{"p":["func_I9Mog['value']"],"id":"func_I9Mog"}],"advancedOptions":{"refetchOnWindowFocus":false,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"object_type":"nso_onboarding_business_development","triggerInputCondition":{"filters":[{"filter":{"value":"{{ func_I9Mog['value'] }}","operator":"LT"},"property":"properties_tentativeSODDate"}],"operator":"AND"}},"name":"Count of High Urgency Records","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_count_records","resourceVersion":32},"type":"APPLICATION","dp":[{"p":"inputs.triggerInputCondition.filters[0].filter.value"}],"interfacePageId":"e_67e255314314991c639c80ef"}
```

### `storage_by_unifyapps/storage_by_unifyapps_aggregate_metadata`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"object_type":"session_id_askunify"},"name":"dataSource62","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_aggregate_metadata","resourceVersion":13224},"type":"APPLICATION","interfacePageId":"e_6a79a58fa3c6662a911f927c"}
```

### `analytics_by_unifyapps/analytics_by_unifyapps_execute_query`
```json
{"dpOn":[],"advancedOptions":{"retryDelay":1500,"retryEnabled":true,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"retryCount":1,"queryDisabled":{"type":"filter","payload":{"filters":[{"property":"{{ e_699832ff448e372f44f1c625['data']['properties']['storeId']['length'] }}","filter":{"operator":"EQUAL","value":"0"}},{"property":"{{ e_699832ff448e372f44f1c625['data']['properties']['storeId']['length'] }}","filter":{"operator":"MISSING"}}],"operator":"OR"}},"runBehaviour":"automatic","retryBackoffFactor":2},"inputs":{"outputSchema":{"type":"object","additionalProperties":false,"required":[],"properties":{"columns":{"type":"object","properties":{"lat":{"type":"string","title":"Lat"},"long":{"type":"string","title":"Long"},"storeCode":{"type":"string","title":"Store Id"},"details":{"type":"string","title":"Details"}},"additionalProperties":false,"title":"columns","required":["lat","long","storeCode","details"]}}},"query":"SELECT\n  _pr_storeId AS storeCode,\n  _pr_latitude_new AS lat,\n  _pr_longitude_new AS long,\n  _pr_address AS details\nFROM ENTITY_ossom_store_address\nWHERE _pr_storeId IN (\n  '{{ e_699832ff448e372f44f1c625[\"data\"][\"properties\"][\"storeId\"].join(\"','\") }}'\n)\n","group":"ENTITY_REPORTING"},"name":"StoreId_Ossom","context":{"appName":"analytics_by_unifyapps","resourceName":"analytics_by_unifyapps_execute_query","resourceVersion":664},"options":{"cacheConfig":{}},"callbacks":{"successEvents":[{"action":{"actionType":"setPageVariable","id":"act_N3aR5","payload":{"variableId":"var_x6rj3","method":"trigger","operationDetails":{"operation":"SET","value":"{{ e_69984b4a57dd174f1371ec7b['data']['objects'][0]['columns']['details'] }}"}},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ var_x6rj3['value'] }}","filter":{"operator":"MISSING"}}],"operator":"AND"}}},"id":"evt_oQ97w","eventType":"onSuccess"},{"action":{"actionType":"setPageVariable","id":"act_rGydu","payload":{"variableId":"var_4W0Ke","method":"trigger","operationDetails":{"operation":"SET","value":"{{ e_69984b4a57dd174f1371ec7b['data']['objects'][0]['columns']['storeCode'] }}"}},"runCondition":{"type":"filter","payload …(trimmed)
```

### `storage_by_unifyapps/storage_by_unifyapps_update_record_fields_by_id`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"writeThroughSessionVariables":false,"object_type":"niva_bupa_validation_result","skipIfBlank":false,"unsetIfNull":false,"skipPermissionCheck":false,"updateFields":[]},"name":"dataSource10","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_update_record_fields_by_id","resourceVersion":11126},"type":"APPLICATION","interfacePageId":"e_global_nivasmartclaim-clone-2"}
```

### `storage_by_unifyapps/storage_by_unifyapps_update_record_by_id`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"var_Fw0Oj","p":["var_Fw0Oj['value']"]},{"id":"e_6aa5942e3f2351706d5b95e1","p":["e_6aa5942e3f2351706d5b95e1['data']['id']"]},{"id":"userContext","p":["userContext['id']"]},{"id":"interfaceRecord","p":["interfaceRecord['id']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"recordId":"{{ var_Fw0Oj['value'] }}_{{ e_6aa5942e3f2351706d5b95e1['data']['id'] }}_{{ userContext['id'] }}","useRawPayload":false,"writeThroughSessionVariables":false,"object_type":"pinned_chats","skipIfBlank":false,"retryOnFailure":true,"record":{"caseId":"{{ e_6aa5942e3f2351706d5b95e1['data']['id'] }}","applicationId":"{{ interfaceRecord['id'] }}","isPinned":true,"userId":"{{ userContext['id'] }}","agentId":"{{ var_Fw0Oj['value'] }}","spaceId":""},"upsert":true},"context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_update_record_by_id","resourceVersion":13575},"name":"pinSelectedChat","callbacks":{"failureEvents":[{"action":{"actionType":"showNotification","executionType":"delay","id":"act_WJYro","payload":{"title":"Action Failed!","type":"error","position":"top-right","method":"trigger"}},"id":"evt_Fjj7Q","eventType":"onFailure"}],"successEvents":[{"action":{"actionType":"controlDataSource","executionType":"delay","id":"act_ZRW4H","payload":{"dataSourceId":"e_6aa5942e3f2351706d5b95dc","method":"trigger"}},"id":"evt_ctO1k","eventType":"onSuccess"},{"action":{"actionType":"setPageVariable","executionType":"delay","id":"act_8a4Kw","payload":{"variableId":"var_Hy5y7","method":"trigger","operationDetails":{"operation":"SET","value":"true"}}},"id":"evt_V76VC","eventType":"onSuccess"},{"action":{"actionType":"showNotification","executionType":"delay","id":"act_M6jw9","payload":{"title":"Chat pinned!","type":"success"}},"id":"evt_U5yDk","eventType":"onSuccess"}]},"interfaceId":"ua-enterprise-chat","dP":[{"p":"inputs.recordId"},{"p":"inputs.record.agentId"},{"p":"inputs.record.applicationId"},{"p":"inputs.record.caseId"},{"p":"inputs.record.userId"}],"type":"APPLICATION","interfacePageId":"e_6aa5942e3f2351706d5b95db"," …(trimmed)
```

### `auth_by_unifyapps/auth_by_unifyapps_login`
```json
{"dpOn":[{"id":"var_voB92","p":["var_voB92['value']"]},{"id":"var_NYx3E","p":["var_NYx3E['value']['id']"]},{"id":"pageInputs","p":["pageInputs['returnTo']"]},{"id":"queryMeta","p":["queryMeta['basePath']"]},{"id":"location","p":["location['origin']"]},{"id":"b_iiClf","p":["b_iiClf['data']['F_pEhQL']"]}],"inputs":{"returnTo":"{{ pageInputs['returnTo'] ? pageInputs['returnTo'] : (queryMeta['basePath'] ?? '/') }}","failureReturnTo":"{{ location['origin'] }}/ua-enterprise-chat_login","formData":{"rememberMe":true,"username":"{{ b_iiClf['data']['F_pEhQL'] }}","password":""},"identityProviderId":"{{ var_voB92['value'] ?? var_NYx3E['value']?.['id'] }}"},"advancedOptions":{"runBehaviour":"manual"},"name":"usernameLoginRequest","context":{"appName":"auth_by_unifyapps","resourceName":"auth_by_unifyapps_login"},"callbacks":{"successEvents":[{"action":{"actionType":"executeScript","executionType":"delay","payload":{"script":"window.location.replace({{e_6a9da27f035a7a40f27693e1['data']['redirectUrl']}});"},"id":"act_xTVnX"},"id":"evt_cWYM8","eventType":"onSuccess"}],"failureEvents":[{"action":{"actionType":"controlBlockMethod","payload":{"blockId":"b_QKqrg","methodName":"resetFields","methodPayload":{"fieldIds":["F_pEhQL"],"resetToDefault":true}},"id":"act_dmyD5"},"id":"evt_oOuTd","eventType":"onFailure"},{"action":{"actionType":"setPageVariable","executionType":"delay","payload":{"variableId":"var_1v45w","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ e_6a9da27f035a7a40f27693e1['error']['message'] }}"}},"id":"act_SFyVs"},"id":"evt_ghs1u","eventType":"onFailure"}]},"type":"APPLICATION","dP":[{"p":"inputs.identityProviderId"},{"p":"inputs.returnTo"},{"p":"inputs.failureReturnTo"},{"p":"inputs.formData.username"}],"interfacePageId":"ua-enterprise-chat_login"}
```

### `code_by_unifyapps/code_by_unifyapps_groovy`
```json
{"dpOn":[],"advancedOptions":{"runBehaviour":"manual","retryEnabled":false,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}},"inputs":{"output":{"additionalProperties":false,"type":"object","required":["timeNew"],"properties":{"timeNew":{"type":"number","title":"Time New"}}},"code":"Date now = new Date()\nreturn [\"timeNew\" : now.getTime()]","compile_static":false,"captureStdOutput":false},"name":"currentTime","context":{"appName":"code_by_unifyapps","resourceName":"code_by_unifyapps_groovy","resourceVersion":100},"options":{"cacheConfig":{}},"callbacks":{"successEvents":[{"action":{"actionType":"setPageVariable","payload":{"method":"setPageVariable","variableId":"var_7EKnh","operationDetails":{"operation":"SET","value":"{{ e_69e5f69b4f9da80626c2fa54['data']['result']['timeNew'] }}"}},"id":"act_o4KDW"},"id":"evt_2ZVMd","eventType":"onSuccess"},{"action":{"actionType":"controlDataSource","payload":{"dataSourceId":"e_69e5f69b4f9da80626c2fa53","method":"trigger"},"id":"act_sVbZU"},"id":"evt_V6vp7","eventType":"onSuccess"},{"action":{"actionType":"controlDataSource","payload":{"dataSourceId":"e_69e5f69b4f9da80626c2fa65","method":"trigger"},"id":"act_eXAMY"},"id":"evt_0KJgV","eventType":"onSuccess"},{"action":{"actionType":"controlDataSource","payload":{"dataSourceId":"e_69e5f69b4f9da80626c2fa52","method":"trigger"},"id":"act_Wfi8F"},"id":"evt_peJHS","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","interfacePageId":"e_69e5f69b4f9da80626c2fa33"}
```

### `storage_by_unifyapps/storage_by_unifyapps_delete_record_by_id`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"var_Fw0Oj","p":["var_Fw0Oj['value']"]},{"id":"e_6aa5942e3f2351706d5b95e1","p":["e_6aa5942e3f2351706d5b95e1['data']['id']"]},{"id":"userContext","p":["userContext['id']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"writeThroughSessionVariables":false,"object_type":"pinned_chats","entityId":"{{ var_Fw0Oj['value'] }}_{{ e_6aa5942e3f2351706d5b95e1['data']['id'] }}_{{ userContext['id'] }}"},"context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_delete_record_by_id","resourceVersion":10966},"name":"unPinSelectedChat","callbacks":{"failureEvents":[{"action":{"actionType":"showNotification","executionType":"delay","id":"act_WJYro","payload":{"title":"Action Failed!","type":"error","position":"top-right","method":"trigger"}},"id":"evt_Fjj7Q","eventType":"onFailure"}],"successEvents":[{"action":{"actionType":"controlDataSource","executionType":"delay","id":"act_7yKYk","payload":{"dataSourceId":"e_6aa5942e3f2351706d5b95dc","method":"trigger"}},"id":"evt_4K72L","eventType":"onSuccess"},{"action":{"actionType":"setPageVariable","executionType":"delay","id":"act_Q3wk4","payload":{"variableId":"var_Hy5y7","method":"trigger","operationDetails":{"operation":"SET","value":"true"}}},"id":"evt_UnRlE","eventType":"onSuccess"},{"action":{"actionType":"showNotification","executionType":"delay","id":"act_QUwS1","payload":{"title":"Chat unpinned!","type":"success"}},"id":"evt_frzS6","eventType":"onSuccess"}]},"interfaceId":"ua-enterprise-chat","dP":[{"p":"inputs.entityId"}],"type":"APPLICATION","interfacePageId":"e_6aa5942e3f2351706d5b95db","target":"page"}
```

### `storage_by_unifyapps/storage_by_unifyapps_delete_records`
```json
{"dpOn":[{"p":["b_apvte['selectedRow']['id']"],"id":"b_apvte"}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"triggerInputCondition":{"filters":[{"filter":{"value":"{{ b_apvte['selectedRow']['id'] }}","operator":"EQUAL"},"property":"id"}],"operator":"AND"},"sortBy":[],"page":{"offset":0,"limit":20},"object_type":"nso_escalation_logs","numberOfRecordsToDelete":"SINGLE"},"name":"Delete Escalation Log","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_delete_records","resourceVersion":44},"callbacks":{"successEvents":[{"action":{"actionType":"controlBlockMethod","payload":{"blockId":"b_apvte","methodName":"refetchData"},"id":"act_HAvOJ"},"id":"evt_Ox0Dd","eventType":"onSuccess"},{"action":{"actionType":"showNotification","payload":{"title":"The Escalation Log has been deleted","type":"success"},"id":"act_CurGi"},"id":"evt_ytiri","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","dp":[{"p":"inputs.triggerInputCondition.filters[0].filter.value"}],"interfacePageId":"e_67f7b3b9e85a9306cd6c00c7"}
```

### `standard_entities/standard_entities_update_space`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"pageInputs","p":["pageInputs['chatId']"]},{"id":"e_6a6b9e4c8324d323e75b80b8","p":["e_6a6b9e4c8324d323e75b80b8['data']['spaceId']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"actionType":"SET","spaceId":"{{ e_6a6b9e4c8324d323e75b80b8['data']['spaceId'] }}","entityId":"{{ pageInputs['chatId'] }}","entityType":"service_hub_case"},"name":"updateSpaceIdField","context":{"appName":"standard_entities","resourceName":"standard_entities_update_space","resourceVersion":3847},"callbacks":{"successEvents":[{"action":{"actionType":"emitPageEvent","executionType":"delay","id":"act_v8yO1","payload":{"eventType":"p_evt_1EByE","eventPayload":{"projectId":"{{ e_6a6b9e4c8324d323e75b80b8['data']['spaceId'] }}"}}},"id":"evt_ioMC5","eventType":"onSuccess"},{"action":{"actionType":"showNotification","executionType":"delay","id":"act_XzTAG","payload":{"title":"Chat moved to {{ b_vJCZa['value'] }} !","type":"success","position":"top-right"}},"id":"evt_fDu4T","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","dP":[{"p":"inputs.entityId"},{"p":"inputs.spaceId"}],"interfacePageId":"e_6a6b99018324d323e75b60e0","target":"page"}
```

### `standard_entities/standard_entities_fetch_entities`
```json
{"metadata":{"isManuallyRenamed":false},"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"entityType":"APIEndpointCollection","group":"STANDARD"},"name":"dataSource95","context":{"appName":"standard_entities","resourceName":"standard_entities_fetch_entities","resourceVersion":22476},"interfaceId":"ua-enterprise-chat","type":"APPLICATION","interfacePageId":"e_6ab2b401da8f871e79e22c8f"}
```

### `auth_by_unifyapps/auth_by_unifyapps_fetch_identity_providers`
```json
{"dpOn":[],"inputs":{"triggerInputCondition":{"filters":[{"property":"type","filter":{"operator":"EQUAL","value":"PASSWORD"}},{"filter":{"value":"OPEN_ID","operator":"EQUAL"},"property":"type"},{"filter":{"value":"SAML","operator":"EQUAL"},"property":"type"},{"filter":{"value":"BIOMETRIC","operator":"EQUAL"},"property":"type"}],"operator":"OR"},"sortBy":[]},"advancedOptions":{"retryDelay":1500,"retryEnabled":true,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":true,"runQueryPeriodically":false},"retryCount":1,"runBehaviour":"manual","retryBackoffFactor":2},"name":"fetchIDPs","context":{"appName":"auth_by_unifyapps","resourceName":"auth_by_unifyapps_fetch_identity_providers"},"options":{"cacheConfig":{}},"callbacks":{"successEvents":[{"action":{"actionType":"setPageVariable","payload":{"method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ e_6a9da27f035a7a40f27693df['data']['objects'].filter((obj) => obj.type === \"OPEN_ID\" || obj.type === \"SAML\") }}"},"variableId":"var_lQMSp"},"id":"act_gXn2O","executionType":"delay"},"id":"evt_dwwHs","eventType":"onSuccess"},{"action":{"actionType":"executeScript","executionType":"delay","payload":{"script":"const addedProviders = new Set();\nconst uniqueIdps = [];\n\nfor (const idp of e_6a9da27f035a7a40f27693df['data']['objects']) {\n  if (idp.type !== 'PASSWORD' || idp.configProvider === 'OTP') continue;\n  if (addedProviders.has(idp.configProvider)) continue;\n  addedProviders.add(idp.configProvider);\n  uniqueIdps.push(idp);\n}\n\nconsole.log(addedProviders);\nvar_3X0cd.setValue(uniqueIdps);"},"id":"act_HGXpm"},"id":"evt_8yS7v","eventType":"onSuccess"},{"action":{"actionType":"setPageVariable","executionType":"delay","payload":{"variableId":"var_NYx3E","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ e_6a9da27f035a7a40f27693df['data']['objects'].find((obj) => obj.type === \"PASSWORD\" && obj.configProvider === 'OTP' ) }}"}},"id":"act_nZoXi"},"id":"evt_oMBBl","eventType":"onSuccess"},{"action":{"actionType":"setPageVariable","executionType":"delay","id":"act_IjoLz","payload":{"variableId":"var_GtczB","method":"trigger","script":"","operationDetails":{"operation" …(trimmed)
```

### `standard_entities/standard_entities_update_user`
```json
{"dpOn":[{"id":"userContext","p":["userContext['id']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"applicationId":"mobileapp","user":"{{ userContext['id'] }}","updateFields":[{"fieldName":"customProperties.showMpinModal","setValue":"true"},{"fieldName":"customProperties.isMPinSetup","setValue":"false"}]},"name":"mpin_modal_handling","context":{"appName":"standard_entities","resourceName":"standard_entities_update_user","resourceVersion":799},"type":"APPLICATION","dP":[{"p":"inputs.user"}],"interfacePageId":"mobileapp_ua_governance_forgot_password"}
```

### `storage_by_unifyapps/storage_by_unifyapps_upsert_record`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"userContext","p":["userContext['id']"]},{"id":"var_7KMgf","p":["var_7KMgf['value']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"writeThroughSessionVariables":false,"object_type":"ai_agent_user_setting","skipIfBlank":false,"updateFields":"{{ var_7KMgf['value'] }}","id":"{{ userContext['id'] }}","skipSchemaValidation":true,"unsetIfNull":false},"name":"upsertUserProfileDetails","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_upsert_record","resourceVersion":13241},"callbacks":{"successEvents":[{"action":{"actionType":"showNotification","executionType":"delay","id":"act_M0S2E","payload":{"title":"Saved","type":"success","method":"trigger"}},"id":"evt_ifzBQ","eventType":"onSuccess"},{"action":{"actionType":"controlDataSource","executionType":"delay","id":"act_IcfFO","payload":{"dataSourceId":"e_6a68bdcd4c009a54b4739ad3","method":"trigger"}},"id":"evt_SN7Gb","eventType":"onSuccess"},{"action":{"actionType":"controlBlockMethod","executionType":"delay","id":"act_p4WJn","payload":{"blockId":"b_gMXky","methodName":"setValue","methodPayload":{"value":"{{ e_6a68bdcd4c009a54b4739ad3['data']['fullName'] }}"}},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ (b_gMXky['value'] || \"\").trim() }}","filter":{"operator":"MAX_LENGTH","value":"0"}}],"operator":"AND"}}},"id":"evt_edfNn","eventType":"onSuccess","disabled":false},{"action":{"actionType":"controlBlockMethod","executionType":"delay","id":"act_nTwa1","payload":{"blockId":"b_aqtti","methodName":"setValue","methodPayload":{"value":"{{ e_6a68bdcd4c009a54b4739ad3['data']['alias'] }}"}},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ (b_aqtti['value'] || \"\").trim() }}","filter":{"operator":"MAX_LENGTH","value":"0"}}],"operator":"AND"}}},"id":"evt_p0ygs","eventType":"onSuccess","disabled":false}],"failureEvents":[{"action":{"actionType":"showNotification","executionType":"delay","id":"act_10YMu","payload":{"title":"Failed!","type":"error","method":"trigger"}},"id":"evt_s4N0k","eventType":"on …(trimmed)
```

### `notification_by_unifyapps/notification_by_unifyapps_fetch_unread_notifications`
```json
{"dpOn":[],"outputSchema":{"type":"array"},"advancedOptions":{"retryDelay":1500,"retryEnabled":true,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"retryCount":1,"queryDisabled":{"type":"filter","payload":{"filters":[{"property":"{{ userContext['context']['device']['os']['name'] }}","filter":{"operator":"EQUAL","value":"macOS"}}],"operator":"AND"}},"runBehaviour":"automatic","retryBackoffFactor":2},"inputs":{},"name":"fetch_unreadnotifications_count","context":{"appName":"notification_by_unifyapps","resourceName":"notification_by_unifyapps_fetch_unread_notifications","resourceVersion":166},"options":{"cacheConfig":{}},"type":"APPLICATION","interfacePageId":"e_global_mobileapp","parentId":"fd_85Ew6"}
```

### `standard_entities/standard_entities_fetch_user`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"interfaceRecord","p":["interfaceRecord['id']"]},{"id":"userContext","p":["userContext['id']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"applicationId":"{{ interfaceRecord['id'] }}","user":"{{ userContext['id'] }}","fetchBy":"id"},"name":"fetchUser_copy_copy","context":{"appName":"standard_entities","resourceName":"standard_entities_fetch_user","resourceVersion":7513},"interfaceId":"sage","type":"APPLICATION","dP":[{"p":"inputs.applicationId"},{"p":"inputs.user"}],"interfacePageId":"e_6a7888c704562649326d2c2c","target":"page"}
```

### `storage_by_unifyapps/storage_by_unifyapps_fetch_distinct_values`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"field":"properties_financialYear","object_type":"i_assurance_quarter_status"},"name":"distinctFYS","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_fetch_distinct_values","resourceVersion":571},"type":"APPLICATION","interfacePageId":"e_6a8e8c036145a16971c6a141"}
```

### `gmail/gmail_send_email`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}},"inputs":{"cc":[],"bcc":[],"labelIds":[],"attachments":[],"reply_to":[],"subject":"Charter Accpted!","to":"<email>","message":"Your charter has been accepted!"},"name":"Send Mail","context":{"appName":"gmail","resourceVersion":258,"connectionId":"<connectionId>","resourceName":"gmail_send_email"},"type":"APPLICATION","interfacePageId":"e_67b1104d8807de6102dea382"}
```

### `auth_by_unifyapps/auth_by_unifyapps_verify_mfa`
```json
{"dpOn":[{"p":["pageInputs['sessionId']","pageInputs['idpId']"],"id":"pageInputs"},{"p":["b_P6j0S['data']['F_SZ1ch']"],"id":"b_P6j0S"}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"code":"{{ b_P6j0S['data']['F_SZ1ch'] }}","sessionId":"{{ pageInputs['sessionId'] }}","identityProviderId":"{{ pageInputs['idpId'] }}"},"name":"Verify Code","context":{"appName":"auth_by_unifyapps","resourceName":"auth_by_unifyapps_verify_mfa"},"callbacks":{"onFailure":{"evt_uqiqN":{"action":{"actionType":"navigateToPage","payload":{"pageInputs":{"returnTo":"{{ pageInputs['returnTo'] }}"},"pageId":"login"},"id":"act_iYK1K","runCondition":{"payload":{"filters":[{"filter":{"value":"Invalid session","operator":"EQUAL"},"property":"{{ e_696fdacbae8b940a831569ec['error']['message'] }}"}],"operator":"AND"},"type":"filter"}},"id":"evt_uqiqN","eventType":"onFailure"},"evt_YD1Kk":{"action":{"actionType":"setPageVariable","payload":{"method":"setPageVariable","operationDetails":{"operation":"SET","value":"true"},"variableId":"var_SZ7cY"},"id":"act_msdU1"},"id":"evt_YD1Kk","eventType":"onFailure"},"evt_5Vg6r":{"action":{"actionType":"controlBlockMethod","payload":{"blockId":"b_P6j0S","methodName":"resetForm"},"id":"act_SfEIw"},"id":"evt_5Vg6r","eventType":"onFailure"}},"onSuccess":{"evt_JsRP0":{"action":{"actionType":"executeScript","payload":{"script":"window.location.href = {{ pageInputs['returnTo'] }} ?? {{ e_696fdacbae8b940a831569ec['data']['redirectUrl'] }}"},"id":"act_evaig"},"id":"evt_JsRP0","eventType":"onSuccess"}}},"type":"APPLICATION","dp":[{"p":"inputs.sessionId"},{"p":"inputs.identityProviderId"},{"p":"inputs.code"}],"interfacePageId":"invoice-management-orbit-testing_mfa_verification"}
```

### `auth_by_unifyapps/auth_by_unifyapps_re_trigger_mfa`
```json
{"dpOn":[{"p":["pageInputs['sessionId']","pageInputs['idpId']"],"id":"pageInputs"}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"sessionId":"{{ pageInputs['sessionId'] }}","identityProviderId":"{{ pageInputs['idpId'] }}"},"name":"Resend Code","context":{"appName":"auth_by_unifyapps","resourceName":"auth_by_unifyapps_re_trigger_mfa"},"callbacks":{"onFailure":{"evt_3IWzc":{"action":{"actionType":"showNotification","payload":{"title":"{{ e_696fdacbae8b940a831569eb['error']['errorId'] }}","type":"error"},"id":"act_JyjvJ"},"id":"evt_3IWzc","eventType":"onFailure"},"evt_53FMq":{"action":{"actionType":"setPageVariable","payload":{"method":"setPageVariable","operationDetails":{"operation":"SET","value":"false"},"variableId":"var_t8Rer"},"id":"act_pclGG"},"id":"evt_53FMq","eventType":"onFailure"}},"onSuccess":{"evt_LGDyH":{"action":{"actionType":"setPageVariable","payload":{"method":"setPageVariable","operationDetails":{"operation":"SET","value":"true"},"variableId":"var_t8Rer"},"id":"act_BWrJt"},"id":"evt_LGDyH","eventType":"onSuccess"},"evt_hfQGa":{"action":{"actionType":"controlBlockMethod","payload":{"blockId":"b_P6j0S","methodName":"resetForm"},"id":"act_aARAE"},"id":"evt_hfQGa","eventType":"onSuccess"}}},"type":"APPLICATION","dp":[{"p":"inputs.sessionId"},{"p":"inputs.identityProviderId"}],"interfacePageId":"invoice-management-orbit-testing_mfa_verification"}
```

### `custom_http_endpoint/custom_http_endpoint_execute`
```json
{"dpOn":[],"advancedOptions":{"retryDelay":1500,"useDirectApi":false,"retryEnabled":true,"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"retryCount":1,"runBehaviour":"automatic","retryBackoffFactor":2},"inputs":{"httpVersion":"HTTP_2","responseContentType":"HEADER_BASED","followRedirects":"NORMAL","isAsync":false,"enableProxy":false,"requestTimeoutInSecs":-1,"authType":"CUSTOM","requestContentType":"application/json","ignoreTrailingSlashes":false,"connectionType":"DIRECT","sslVerify":false,"certificateType":"CERT_STRING"},"name":"Custom_HTTP_Endpoint","context":{"appName":"custom_http_endpoint","resourceName":"custom_http_endpoint_execute","resourceVersion":1255},"options":{"cacheConfig":{}},"type":"APPLICATION","interfacePageId":"e_69da8ddccc530952069d78f5"}
```

### `conv_ai_by_unifyapps/conv_ai_by_unifyapps_publish_response`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"var_tAJru","p":["var_tAJru['value']"]},{"id":"var_KoDde","p":["var_KoDde['value']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"defaultFallbackWorkflowId":"66fbed229edc4e0b6303cefd","callableInterfaceId":"__ua__publish_response_interface","parameters":{"responses":[{"content":"Hi, I have full context on {{ var_tAJru['value'] }} account, What would you like to explore?"}],"caseId":"{{ var_KoDde['value'] }}"}},"name":"publishInterfaceForGenericCopilot","context":{"appName":"conv_ai_by_unifyapps","resourceName":"conv_ai_by_unifyapps_publish_response","resourceVersion":281},"callbacks":{"successEvents":[],"failureEvents":[{"action":{"actionType":"setPageVariable","executionType":"delay","id":"act_7RkIc","payload":{"variableId":"var_msKbd","method":"trigger","operationDetails":{"operation":"SET","value":"yes"}}},"id":"evt_YXuCI","eventType":"onFailure"}]},"type":"APPLICATION","dP":[{"p":"inputs.parameters.responses[0].content"},{"p":"inputs.parameters.caseId"}],"interfacePageId":"e_global_sales-dashboard-customer360"}
```

### `storage_by_unifyapps/storage_by_unifyapps_bulk_create_records`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"var_XlUfp","p":["var_XlUfp['value']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"useRawPayload":false,"object_type":"knowledge","skipIfBlank":false,"records":"{{ var_XlUfp['value'] }}"},"name":"saveBulkFiles","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_bulk_create_records","resourceVersion":12855},"callbacks":{"successEvents":[{"action":{"actionType":"controlDataSource","id":"act_raYOp","payload":{"dataSourceId":"e_6a356f1da176e756098d0b9e","method":"trigger"}},"id":"evt_VDamo","eventType":"onSuccess"},{"action":{"actionType":"setPageVariable","executionType":"delay","id":"act_dIj97","payload":{"variableId":"var_g0RmD","method":"trigger","operationDetails":{"operation":"SET","value":"false"}}},"id":"evt_xORU3","eventType":"onSuccess"},{"action":{"actionType":"controlMediaUploads","executionType":"delay","id":"act_181HM","payload":{"operation":"resetMediaUploads","config":{"supportedFileTypes":[],"multipleFiles":false,"fileVisibility":"RESTRICTED"},"method":"trigger"}},"id":"evt_rEu6B","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","dP":[{"p":"inputs.records"}],"interfacePageId":"e_6a356f1da176e756098d0b45","parentId":"fd_snQyy"}
```

### `notification_by_unifyapps/notification_by_unifyapps_fetch_notifications`
```json
{"dpOn":[],"outputSchema":{"type":"array","items":{"type":"object","properties":{"content":{"type":"string"},"createdTime":{"type":"integer"},"cta":{"type":"object","properties":{"name":{"type":"string"},"openInNewPage":{"type":"boolean"},"width":{"type":"object","properties":{"custom":{"type":"string"}}},"pageInputs":{"type":"object","properties":{"claim_id":{"type":"string"}}},"page":{"type":"string"},"type":{"type":"string"},"url":{"type":"string"},"target":{"type":"string"}}},"deleted":{"type":"boolean"},"fromUser":{"type":"string"},"id":{"type":"string"},"lastModifiedBy":{"type":"integer"},"modifiedTime":{"type":"integer"},"notificationEventType":{"type":"string"},"ownerUserId":{"type":"integer"},"previewTime":{"type":"integer"},"read":{"type":"boolean"},"receiverId":{"type":"string"},"receiverType":{"type":"string"},"standard":{"type":"boolean"},"version":{"type":"integer"},"_header":{"type":"string"},"_timeAgo":{"type":"string"},"body":{"type":"string"},"image":{"type":"string"}}}},"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"applicationId":"mobileapp","userId":"900622","includeDeleted":true},"name":"dataSource201","context":{"appName":"notification_by_unifyapps","resourceName":"notification_by_unifyapps_fetch_notifications","resourceVersion":261},"options":{"transformerConfig":{"enabled":true,"includeOriginalOutput":true,"inputs":{"code":"/**\n * notifications: array of notification objects\n * deviceEpoch: automatically mapped from frontend function\n */\nfunction transformNotifications(notifications) {\n  \n  // 1️⃣ Map device epoch from frontend function\n  const deviceEpoch = {{ func_8rs3T['value'] }}; // <-- Automatically mapped\n\n  // 2️⃣ Calculate offset between device and server\n  const serverEpoch = Date.now(); // current backend server time\n  const offsetMs = deviceEpoch - serverEpoch; // positive if device ahead of server\n  \n  // 3️⃣ Helper to format date nicely\n  function formatDate(timestamp) {\n    const date = new Date(timestamp);\n    const options = { year: 'numeric', month: 'long', day: 'numeric' };\n    return date.toLocale …(trimmed)
```

### `analytics_by_unifyapps/analytics_by_unifyapps_aggregate_metadata`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"filterable":true,"page":{"limit":1000},"sortable":true,"entityType":"ENTITY_quotations","group":"ENTITY_REPORTING"},"name":"aggregateMetadataFilters","context":{"appName":"analytics_by_unifyapps","resourceName":"analytics_by_unifyapps_aggregate_metadata","resourceVersion":634},"type":"APPLICATION","interfacePageId":"e_6a18323e391b723cb4aab0f4"}
```

### `standard_entities/standard_entities_reset_password`
```json
{"dpOn":[{"id":"b_POoBg","p":["b_POoBg['data']['F_cyXj7']"]}],"inputs":{"deleteSessions":true,"update_type":"SELF","password":"{{ b_POoBg['data']['F_cyXj7'] }}"},"advancedOptions":{"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"name":"updatePasswordDatasource","context":{"appName":"standard_entities","resourceName":"standard_entities_reset_password"},"callbacks":{"successEvents":[{"action":{"actionType":"showNotification","payload":{"autoHideDuration":1000,"title":"Your password has been updated successfully! Redirecting you now…","type":"success"},"id":"act_w5O6l"},"id":"evt_kCxLM","eventType":"onSuccess"},{"action":{"actionType":"executeScript","delayDuration":1000,"payload":{"script":"window.location.href = pageInputs['returnTo'] ?? queryMeta['basePath'] ?? '/';"},"id":"act_ln57f"},"id":"evt_fLRYp","eventType":"onSuccess"}],"failureEvents":[{"action":{"actionType":"showNotification","payload":{"title":"{{ e_698c4af5ce743d0a891b8eb0['error']['message'] }}","type":"error","position":"top-right"},"id":"act_YIY0E"},"id":"evt_CzI2d","eventType":"onFailure"}]},"type":"APPLICATION","dP":[{"p":"inputs.password"}],"interfacePageId":"test-madhav_update_password"}
```

### `audit_by_unifyapps/audit_by_unifyapps_get_audit_records_for_asset`
```json
{"dpOn":[{"p":["b_VRiZU['selectedRow']['id']"],"id":"b_VRiZU"}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"assetId":"{{ b_VRiZU['selectedRow']['id'] }}","sortOrder":"DESC","assetClass":"e_page_templates_task_listing"},"name":"Task Activity","context":{"appName":"audit_by_unifyapps","resourceName":"audit_by_unifyapps_get_audit_records_for_asset","resourceVersion":226},"type":"APPLICATION","dp":[{"p":"inputs.assetId"}],"interfacePageId":"e_698c4aabd99b1a46892ba694"}
```

### `utility_by_unifyapps/utility_by_unifyapps_generate_public_url`
```json
{"dpOn":[{"id":"b_AQq9e","p":["b_AQq9e['files'][0]"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"expiryTime":72,"file":"{{ b_AQq9e['files'][0] }}"},"name":"dataSource2","context":{"appName":"utility_by_unifyapps","resourceName":"utility_by_unifyapps_generate_public_url","resourceVersion":979},"type":"APPLICATION","dP":[{"p":"inputs.file"}],"interfacePageId":"e_69679c2ac789c57f7297188c"}
```

### `formbuilder_123/formbuilder_123_create_form`
```json
{"metadata":{"isManuallyRenamed":false},"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}},"name":"dataSource19","context":{"appName":"formbuilder_123","resourceName":"formbuilder_123_create_form","resourceVersion":635},"type":"APPLICATION","interfacePageId":"e_global_sujal-aggarwal"}
```

### `gdrive/gdrive_export_file`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"fileId":"1in1sfjg08KvfwxdWrdvHmb6rcDYYBvcv","mimeType":"image/png"},"name":"dataSource7","context":{"connectionId":"<connectionId>","resourceName":"gdrive_export_file","appName":"gdrive","resourceVersion":1895},"type":"APPLICATION","interfacePageId":"e_6976637003290a6719d55a29","tags":["File"]}
```

### `openai/openai_send_message`
```json
{"dpOn":[{"p":["pageInputs['projectTitle']","pageInputs['experienceZone']","pageInputs['targetAudience']","pageInputs['budgetRange']"],"id":"pageInputs"}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"response_format":"text","model":"gpt-3.5-turbo","message":"Based on these event details for Visit Qatar:\nProject Title: {{ pageInputs['projectTitle'] }}\nExperience Zone: {{ pageInputs['experienceZone'] }}\nTarget Audience: {{ pageInputs['targetAudience'] }}\nBudget Range: {{ pageInputs['budgetRange'] }}\n\n\nPlease create a detailed description of the project\nONLY RETURN THE DESCRIPTION AS OUTPUT, NOTHING ELSE."},"name":"Project Description","context":{"appName":"openai","resourceVersion":212,"connectionId":"<connectionId>","resourceName":"openai_send_message"},"callbacks":{"onSuccess":{}},"type":"APPLICATION","dp":[{"p":"inputs.message"}],"interfacePageId":"e_67af77b27458f929e0037002"}
```

### `routines_by_unifyapps/routines_by_unifyapps_list_routine_runs`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"e_6a9221207312f702c76a2614","p":["e_6a9221207312f702c76a2614['data']['properties']['routineId']"]},{"id":"b_BSRZk","p":["b_BSRZk['pagination']['offset']","b_BSRZk['pagination']['pageSize']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"limit":"{{ b_BSRZk['pagination']['pageSize'] }}","sortBy":[{"field":"properties_startedAt","order":"DESC"}],"offset":"{{ b_BSRZk['pagination']['offset'] }}","routineId":"{{ e_6a9221207312f702c76a2614['data']['properties']['routineId'] }}"},"name":"fetchRoutineRuns","context":{"appName":"routines_by_unifyapps","resourceName":"routines_by_unifyapps_list_routine_runs","resourceVersion":123},"interfaceId":"ua-enterprise-chat","type":"APPLICATION","dP":[{"p":"inputs.routineId"},{"p":"inputs.offset"},{"p":"inputs.limit"}],"interfacePageId":"e_6a92208b7312f702c76a212b"}
```

### `standard_entities/standard_entities_get_latest_app_release`
```json
{"metadata":{"isManuallyRenamed":false},"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"platform":"MACOS","interfaceId":"ua-enterprise-chat"},"name":"dataSource102","context":{"appName":"standard_entities","resourceName":"standard_entities_get_latest_app_release","resourceVersion":8},"interfaceId":"ua-enterprise-chat","type":"APPLICATION","interfacePageId":"e_6a4fa27dd46d4e608bbd1d72"}
```

### `routines_by_unifyapps/routines_by_unifyapps_delete_routine`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"var_cv7F0","p":["var_cv7F0.value"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"routineId":"{{ var_cv7F0.value }}"},"name":"deleteRoutine","context":{"appName":"routines_by_unifyapps","resourceName":"routines_by_unifyapps_delete_routine","resourceVersion":137},"interfaceId":"ua-enterprise-chat","type":"APPLICATION","dP":[{"p":"inputs.routineId"}],"interfacePageId":"e_6a5f04d0f62c9924bb17003b"}
```

### `standard_entities/standard_entities_disable_connection`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"var_hNvty","p":["var_hNvty['value']"]},{"id":"var_qg7p4","p":["var_qg7p4['value']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"connectionId":"<connectionId>","appName":"{{ var_hNvty['value'] }}"},"name":"disbaleUserConnection","context":{"appName":"standard_entities","resourceName":"standard_entities_disable_connection","resourceVersion":11571},"callbacks":{"successEvents":[{"action":{"actionType":"controlDataSource","executionType":"delay","id":"act_luSxd","payload":{"dataSourceId":"e_6a50ce2dd46d4e608bc5223a","method":"trigger"}},"id":"evt_1dBcY","eventType":"onSuccess"},{"action":{"actionType":"triggerFunction","executionType":"delay","id":"act_csnIh","payload":{"functionId":"func_lfXUT"}},"id":"evt_yeOcR","eventType":"onSuccess"}],"failureEvents":[]},"interfaceId":"ua-enterprise-chat","type":"APPLICATION","dP":[{"p":"inputs.appName"},{"p":"inputs.connectionId"}],"interfacePageId":"e_6a4fa27dd46d4e608bbd1d72","parentId":"fd_J1dZO"}
```

### `standard_entities/standard_entities_deploy_entity`
```json
{"dpOn":[{"id":"e_6a356f1da176e756098d0bb0","p":["e_6a356f1da176e756098d0bb0['data']['properties']['agentId']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"entityType":"ai_agent","id":"{{ e_6a356f1da176e756098d0bb0['data']['properties']['agentId'] }}"},"name":"deployAgent","context":{"appName":"standard_entities","resourceName":"standard_entities_deploy_entity","resourceVersion":3896},"type":"APPLICATION","dP":[{"p":"inputs.id"}],"interfacePageId":"e_6a356f1da176e756098d0b45"}
```

### `code_by_unifyapps/code_by_unifyapps_javascript`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"output":{"type":"object","additionalProperties":false,"required":[],"properties":{"date_epoch":{"type":"integer","title":"Date Epoch"}}},"code":"// Calculate 120 days ago in milliseconds\nconst daysAgo = 120;\nconst millisecondsPerDay = 24 * 60 * 60 * 1000;\n\n// Current date/time in epoch\nconst now = Date.now();\n\n// 120 days ago\nconst pastEpoch = now - (daysAgo * millisecondsPerDay);\n\n// Build output object\nconst output = {\n  date_epoch: pastEpoch\n};\n\noutput;","isAsync":false},"name":"date_epoch_calculation","context":{"appName":"code_by_unifyapps","resourceName":"code_by_unifyapps_javascript","resourceVersion":359},"type":"APPLICATION","interfacePageId":"e_68be9810174059281fb3fb35"}
```

### `utility_by_unifyapps/utility_by_unifyapps_to_json_object`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"pageInputs","p":["pageInputs['New_Array_Customize']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"jsonString":"{{ pageInputs['New_Array_Customize'] }}"},"name":"deserializedNewArrayCustomize","context":{"appName":"utility_by_unifyapps","resourceName":"utility_by_unifyapps_to_json_object","resourceVersion":2730},"type":"APPLICATION","dP":[{"p":"inputs.jsonString"}],"interfacePageId":"e_6a399ec5844cce065ec4e5d0"}
```

### `callables/callables_call_automation_streaming`
```json
{"dpOn":[],"outputSchema":{"type":"object","properties":{"data":{"type":"string"}},"required":["data"]},"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"automationId":"695271a04150490db23ecf55","runtimeConnections":{},"version":"-1","parameters":{}},"name":"Temp","context":{"appName":"callables","resourceName":"callables_call_automation_streaming","resourceVersion":499},"type":"APPLICATION","interfacePageId":"e_6950ec122acdb628ba5f0d51","tags":["Streaming"]}
```

### `notification_by_unifyapps/notification_by_unifyapps_delete_notification`
```json
{"dpOn":[{"id":"var_32Xvw","p":["var_32Xvw['value']"]},{"id":"var_9pJqR","p":["var_9pJqR['value']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"notificationId":"{{ var_32Xvw['value'] }}","receiverType":"{{ var_9pJqR['value'] }}"},"name":"Clear_Single_Notification","context":{"appName":"notification_by_unifyapps","resourceName":"notification_by_unifyapps_delete_notification","resourceVersion":7},"callbacks":{"successEvents":[{"action":{"actionType":"controlDataSource","id":"act_IQwqg","payload":{"dataSourceId":"e_68dd0878a23d8a0c8882da04","method":"trigger"}},"id":"evt_FPu9f","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","dP":[{"p":"inputs.notificationId"},{"p":"inputs.receiverType"}],"interfacePageId":"e_68dd0878a23d8a0c8882da01"}
```

### `notification_by_unifyapps/notification_by_unifyapps_delete_all`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{},"name":"Clear_all_notifications","context":{"appName":"notification_by_unifyapps","resourceName":"notification_by_unifyapps_delete_all","resourceVersion":90},"callbacks":{"successEvents":[{"action":{"actionType":"controlDataSource","id":"act_DdBvm","payload":{"dataSourceId":"e_68dd0878a23d8a0c8882da04","method":"trigger"}},"id":"evt_56TWY","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","interfacePageId":"e_68dd0878a23d8a0c8882da01"}
```

### `notification_by_unifyapps/notification_by_unifyapps_mark_notification_as_read`
```json
{"standard":true,"dpOn":[{"id":"var_32Xvw","p":["var_32Xvw['value']"]},{"id":"var_9pJqR","p":["var_9pJqR['value']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"notificationId":"{{ var_32Xvw['value'] }}","receiverType":"{{ var_9pJqR['value'] }}"},"name":"Mark_Notification_As_Read","context":{"appName":"notification_by_unifyapps","resourceName":"notification_by_unifyapps_mark_notification_as_read","resourceVersion":12},"callbacks":{"successEvents":[{"action":{"actionType":"controlDataSource","payload":{"dataSourceId":"e_68dd0878a23d8a0c8882da04","method":"trigger"},"id":"act_0KgmV"},"id":"evt_hQxEG","eventType":"onSuccess"},{"action":{"actionType":"controlDataSource","payload":{"dataSourceId":"e_68dd0878a23d8a0c8882da06","method":"trigger"},"id":"act_SPIUk"},"id":"evt_TQHbI","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","dP":[{"p":"inputs.notificationId"},{"p":"inputs.receiverType"}],"interfacePageId":"e_68dd0878a23d8a0c8882da01"}
```

### `standard_entities/standard_entities_fetch_connection_schema`
```json
{"standard":true,"metadata":{"isManuallyRenamed":true},"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"appName":"{{ var_d7Z5D['value'] }}"},"context":{"appName":"standard_entities","resourceName":"standard_entities_fetch_connection_schema","resourceVersion":3501},"name":"fetchSchema","type":"APPLICATION","interfacePageId":"e_6a2512d1156e2c1829b2064e"}
```

### `standard_entities/standard_entities_get_connection_details`
```json
{"standard":true,"metadata":{"isManuallyRenamed":true},"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"includeCredentials":false,"connectionIds":"{{ var_2ycUo['value'] }}"},"context":{"appName":"standard_entities","resourceName":"standard_entities_get_connection_details","resourceVersion":3501},"name":"fetchConnectionDetails","type":"APPLICATION","interfacePageId":"e_6a2512d1156e2c1829b2064e"}
```

### `storage_by_unifyapps/storage_by_unifyapps_export_records`
```json
{"dpOn":[{"id":"pageInputs","p":["pageInputs['accountID']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"maxRowsPerFile":1048576,"fileName":"Stakeholder Matrix","triggerInputCondition":{"filters":[{"property":"properties_id","filter":{"operator":"EQUAL","value":"{{ pageInputs['accountID'] }}"}}],"operator":"AND"},"useStreaming":false,"sheetName":"Sheet_0","object_type":"stakeholder_matrix","format":"MM/dd/yyyy","preserveDataTypes":false,"recordsBatchSize":100,"writeToMultipleFilesIfOverflow":false,"keepExactFileName":true,"fileType":"CSV"},"name":"dataSource74","context":{"appName":"storage_by_unifyapps","resourceName":"storage_by_unifyapps_export_records","resourceVersion":810},"type":"APPLICATION","dP":[{"p":"inputs.triggerInputCondition.filters[0].filter.value"}],"interfacePageId":"e_6a3e5329d920343178e83924"}
```

### `platform_by_unifyapps/platform_by_unifyapps_get_api_schema`
```json
{"metadata":{"isManuallyRenamed":true},"dpOn":[{"id":"userContext","p":["userContext['id']","userContext['contactDetails']['email']"]},{"id":"var_Esx74","p":["var_Esx74['value']['state']","var_Esx74['value']['code']"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"operationId":"createConnectionWithInput","requestSchema":{"queryParams":{"appName":"gcalendar"},"body":{"inputs":"{{{\n\"name\": \"GCalender_{{ userContext['id'] }}_{{ userContext['contactDetails']['email'] }}\",\n\"authType\": \"OAUTH\",\n\"rateLimitConfig\": {\n\"enabled\": false\n},\n\"circuitBreakerConfig\": {\n\"enabled\": false\n},\n\"state\": var_Esx74['value']['state'],\n\"code\": var_Esx74['value']['code'],\n\"scope\": \"https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.readonly\"}}}","name":"GCalender_{{ userContext['id'] }}_{{ userContext['contactDetails']['email'] }}","authType":"OAUTH"}}},"name":"Create_Google_Calendar_Connection_","context":{"appName":"platform_by_unifyapps","resourceName":"platform_by_unifyapps_get_api_schema","resourceVersion":1045},"callbacks":{"successEvents":[{"action":{"actionType":"setPageVariable","id":"act_pdDQ9","payload":{"variableId":"var_zKNcd","method":"trigger","operationDetails":{"operation":"SET","value":"{{ e_69d4ae4552d7ee2bad821d63['data']['id'] }}"}}},"id":"evt_AMOEq","eventType":"onSuccess"},{"action":{"actionType":"controlDataSource","id":"act_WRBpC","payload":{"dataSourceId":"e_69d4e50167955254a79d9636","method":"trigger"}},"id":"evt_NfsY3","eventType":"onSuccess"}],"failureEvents":[]},"type":"APPLICATION","dP":[{"p":"inputs.requestSchema.body.inputs"},{"p":"inputs.requestSchema.body.name"}],"interfacePageId":"e_696e83a30cf33b3964a5b5c2"}
```

### `auth_by_unifyapps/auth_by_unifyapps_trigger_reset_password`
```json
{"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"username":"{{ b_nNRnp['data']['F_4875r'] }}"},"name":"sendForgotPasswordEmail","context":{"appName":"auth_by_unifyapps","resourceName":"auth_by_unifyapps_trigger_reset_password"},"callbacks":{"successEvents":[{"action":{"actionType":"setPageVariable","payload":{"method":"setPageVariable","variableId":"var_sUOEi","operationDetails":{"operation":"SET","value":"Couldn't send reset link"}},"id":"act_uemUW"},"id":"evt_9Pg4j","eventType":"onSuccess"},{"action":{"actionType":"setPageVariable","payload":{"method":"setPageVariable","variableId":"var_ZPoXd","operationDetails":{"operation":"SET","value":"true"}},"id":"act_E2vZJ"},"id":"evt_O0zYo","eventType":"onSuccess"}],"failureEvents":[{"action":{"actionType":"setPageVariable","payload":{"method":"trigger","variableId":"var_sUOEi","operationDetails":{"operation":"SET","value":"{{ e_69679c2ac789c57f72971890['error']['message'] }}"}},"id":"act_cYaAk"},"id":"evt_MMqLd","eventType":"onFailure"}]},"type":"APPLICATION","interfacePageId":"e_69679c2ac789c57f72971890"}
```

### `notification_by_unifyapps/notification_by_unifyapps_send_notification`
```json
{"metadata":{"isManuallyRenamed":false},"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"cta":{"type":"url","width":{"custom":"400px"}},"applicationId":"","notificationPreviewTime":5,"receiverType":"USER","content":{"templateId":"failed_export_notification_template"}},"name":"dataSource9","context":{"appName":"notification_by_unifyapps","resourceName":"notification_by_unifyapps_send_notification","resourceVersion":1859},"type":"APPLICATION","interfacePageId":"e_6a46935562b61347dc0b53b7"}
```

### `pdf_by_unifyapps/pdf_by_unifyapps_add_signature`
```json
{"dpOn":[{"id":"b_gMcm2","p":["b_gMcm2['files'][0]"]},{"id":"b_TMEhg","p":["b_TMEhg['files'][0]"]}],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"manual"},"inputs":{"file":"{{ b_gMcm2['files'][0] }}","signaturePosition":{"x":12,"y":121,"width":12,"height":12},"transparentSignature":false,"signature":"{{ b_TMEhg['files'][0] }}","removeSecurity":false},"name":"dataSource2","context":{"appName":"pdf_by_unifyapps","resourceName":"pdf_by_unifyapps_add_signature","resourceVersion":341},"callbacks":{"successEvents":[{"action":{"actionType":"showNotification","id":"act_q4dP8","payload":{"title":"done","type":"success","position":"top-right","method":"trigger"}},"id":"evt_1ALFq","eventType":"onSuccess"}],"failureEvents":[{"action":{"actionType":"showNotification","id":"act_FeoSN","payload":{"title":"fail","type":"error","position":"top-right","method":"trigger"}},"id":"evt_tbAxs","eventType":"onFailure"}]},"type":"APPLICATION","dP":[{"p":"inputs.file"},{"p":"inputs.signature"}],"interfacePageId":"e_6989ba6379406237b075e900"}
```

### `analytics_by_unifyapps/analytics_by_unifyapps_execute_update`
```json
{"dpOn":[],"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false},"runBehaviour":"automatic"},"inputs":{"query":"SELECT _pr_EMPLID\r\nFROM ENTITY_employee_master e\r\nWHERE e._pr_NAME = 'Amit Pratap Verma'\r\n  AND e._pr_LASTUPDDTTM = (\r\n        SELECT MAX(e2._pr_LASTUPDDTTM)\r\n        FROM ENTITY_employee_master e2\r\n        WHERE e2._pr_NAME = e._pr_NAME\r\n          AND e2._pr_LASTUPDDTTM IS NOT NULL\r\n  );\r\n","group":"ENTITY_REPORTING"},"name":"email_copy","context":{"appName":"analytics_by_unifyapps","resourceName":"analytics_by_unifyapps_execute_update","resourceVersion":69},"type":"APPLICATION","interfacePageId":"e_69452815968cb5449063af6a"}
```

### `sap_successfactors/sap_successfactors_fetch_leave_details_of_employee`
```json
{"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}},"name":"SAP SuccessFactor","context":{"appName":"sap_successfactors","resourceVersion":2,"resourceName":"sap_successfactors_fetch_leave_details_of_employee"},"type":"APPLICATION","interfacePageId":"e_6757208c3af74901f2a29f63"}
```

### `microsoft_dynamics365/microsoft_dynamics365_get_object_by_id`
```json
{"advancedOptions":{"refetchOnWindowFocus":true,"timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}},"name":"Fetch Timesheet Data","context":{"appName":"microsoft_dynamics365","resourceVersion":152,"resourceName":"microsoft_dynamics365_get_object_by_id"},"type":"APPLICATION","interfacePageId":"e_675682d93af74901f29acc1f"}
```
