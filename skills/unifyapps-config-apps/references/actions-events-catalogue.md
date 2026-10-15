# Actions and events — harvested catalogue

From the same harvest (100,042 blocks carry events). An event is `{id, eventType, action, targetId?, hidden?}`;
an action is `{id, actionType, executionType:"delay", payload, onSuccessActions?, onErrorActions?, runCondition?,
delayDuration?}`. `targetId` addresses a sub-control of the block (a CopilotInput action, a Table add-on).

## Event types by frequency

`onClick` 22934, `onChange` 5139, `onCheckChange` 977, `onSubmit` 878, `onPress` 373, `onRowSelect` 328, `onSelectItem` 257, `onFocus` 241, `onMouseEnter` 236, `onClose` 224, `onClickCell` 184, `onOutputChange` 132, `onCitationClick` 113, `onVoiceModeConnectError` 100, `onInsertMessage` 98, `onBlur` 94, `onTimerExpire` 44, `onMessageSent` 35, `onClickAway` 33, `onFilterChange` 29, `onFileUpload` 21, `onCaseCreated` 16, `onSelectInterval` 14, `onPhotoCapture` 14, `onOpen` 13, `onQueryCostClick` 12, `onSave` 12, `onMessageReceived` 12

`p_evt_*` are **page events**: declared in the page's `events`, fired with `emitPageEvent`, handled by any block
that lists that eventType.

## Events per component (top 30)

- **Button**: onClick (10504), onSubmit (28), onMouseEnter (5)
- **Card**: onClick (4636), onMouseEnter (224)
- **IconButton**: onClick (3434), ON_CLICK (2)
- **Stack**: onClick (2070), onMouseEnter (7), onPageLoad (3)
- **Form**: onChange (891), onSubmit (822), onBlur (45), onFocus (33)
- **RadioButton**: onChange (1312)
- **SingleSelect**: onChange (1184), ON_CHANGE (2)
- **TextInput**: onChange (844), onFocus (200), onBlur (34), onSubmit (19)
- **Checkbox**: onCheckChange (977)
- **Table**: onClick (367), onRowSelect (324), onClickCell (184), onChange (60), onSave (5), onPageChange (2), onRowSelectionChange (2)
- **Module**: onOutputChange (94)
- **CopilotInput**: onChange (274), onClick (233), onFocus (5), onManageSkills (4), onBlur (2)
- **Tag**: onClick (434)
- **Copilot**: onCitationClick (113), onInsertMessage (98), onVoiceModeConnectError (91), onMessageSent (35), onCaseCreated (16), onQueryCostClick (12), onConnectEmailAccount (8), onOpenCopilotCanvas (6)
- **Pressable**: onPress (373), onLongPress (1)
- **ButtonGroup**: onClick (362)
- **TemplateComponent**: onOutputChange (38)
- **TextArea**: onChange (232), onBlur (13), onSubmit (9), onFocus (3)
- **Repeatable**: onSelectItem (243), onOrderChange (10), onPullDown (2)
- **Menu**: onClick (236), OnMenuItemClick (6)
- **Image**: onClick (202)
- **Icon**: onClick (191)
- **Drawer**: onClose (110), onCollapse (9), onOpen (7)
- **Calendar**: onChange (114)
- **Link**: onClick (113)
- **Modal**: onClose (79), onOpen (4)
- **KeyValue**: onChange (67)
- **ContextualDialog**: onClickAway (33), onClose (27), onOpen (2)
- **Tabs**: onChange (62)
- **Timer**: onTimerExpire (44), onTimerIntervalElapsed (1)

## Action types — frequency and real payloads

### `setPageVariable` · 13725
```json
{"actionType":"setPageVariable","executionType":"delay","id":"act_jbipY","payload":{"variableId":"var_voB92","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ var_NYx3E['value']?.['id'] }}"}},"onSuccessActions":[{"actionType":"setPageVariable","executionType":"delay","id":"act_igd3L","payload":{"variableId":"var_GtczB","method":"setPageVariable","operationDetails":{"operation":"SET","value":"otp"}}}]}
```
```json
{"actionType":"setPageVariable","executionType":"delay","id":"act_rMhNF","payload":{"variableId":"var_GtczB","method":"setPageVariable","operationDetails":{"operation":"SET","value":"otp"}}}
```

### `controlBlockMethod` · 5174
```json
{"actionType":"controlBlockMethod","payload":{"blockId":"b_OR9iS","methodName":"submitForm"},"id":"act_fyMKl"}
```
```json
{"actionType":"controlBlockMethod","payload":{"blockId":"b_iiClf","methodName":"submitForm"},"id":"act_fyMKl"}
```

### `navigateToPage` · 3016
```json
{"actionType":"navigateToPage","executionType":"delay","payload":{"pageId":"ua_governance_forgot_password","target":"_self","history":"replace","overridePageAnimation":false},"id":"act_lPSJm"}
```
```json
{"actionType":"navigateToPage","payload":{"pageInputs":{},"history":"push","pageId":"mobileapp_signup","target":"_self"},"id":"act_gqT5X"}
```

### `controlDataSource` · 2552
```json
{"actionType":"controlDataSource","payload":{"dataSourceId":"e_6a9da27f035a7a40f27693de","method":"trigger"},"id":"act_g31KZ","executionType":"delay"}
```
```json
{"actionType":"controlDataSource","payload":{"dataSourceId":"e_6a9c5df8024f9a2712fb142f","method":"trigger"},"id":"act_y4mx0"}
```

### `controlModal` · 2433
```json
{"actionType":"controlModal","payload":{"method":"trigger","modalId":"b_T8Dsh","operation":"hide"},"id":"act_LYplv"}
```
```json
{"actionType":"controlModal","payload":{"method":"trigger","modalId":"b_n6AH3","operation":"hide","variableId":"var_xleeg","operationDetails":{"operation":"SET","value":"0"}},"id":"act_PK91V"}
```

### `showNotification` · 1549
```json
{"id":"act_btn_nogo_notify","actionType":"showNotification","payload":{"title":"Deal archived","type":"info"}}
```
```json
{"id":"act_btn_nogo_notify","actionType":"showNotification","payload":{"title":"Deal archived","type":"info"}}
```

### `executeScript` · 1287
```json
{"actionType":"executeScript","executionType":"delay","id":"act_zNso0","payload":{"script":"const regionId = Number({{ b_aQgHz['value'] }});\n\n// Design center groups\nconst designCenters =\n  {{ e_6a79a58fa3c6662a911f92a1['data']['designCenters'] }} || [];\n\n// Find matching group\nconst result = designCenters.find(\n  d => d.groupId === regionId\n);\n\nif (!result?.markers) return;\n\n// Set markers\n{{ var_vyKio['setValue'] }}(result.markers);","method":"trigger"}}
```
```json
{"actionType":"executeScript","executionType":"delay","id":"act_ghOGy","payload":{"script":"const id = {{ b_aQgHz['value'] }};\nconst result = {{ var_zpFku['value'] }}[id] ?? {{ var_zpFku['value'] }}[String(id)] ?? {{ var_zpFku['value'] }}[Number(id)];\nif(!result) return;\nlet setValue = {{ var_rPbiV['setValue'] }};\nsetValue(result);\n// const result2 = {{ var_9MqGZ['value'] }}[id] ?? {{ var_9MqGZ['value'] }}[String(id)] ?? {{ var_9MqGZ['value'] }}[Number(id)];\n// let setValue1 = {{ var_1uwdZ['setValue1'] }};\n// setValue1(result2);","method":"trigger"},"onSuccessActions":[{"actionType":"setPageVariable","executionType":"delay","id":"act_NSLsi","payload":{"variableId":"var_HesNq","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{\n  {\n  \"type\": \"markers\",\n  \"accessToken\": envVariables['MAPBOXGL_PAT'],\n  \"theme\": \"dark\",\n  \"zoom\": 3,\n  \"region\" : {{ var_rPbiV['value'] }},\n  \"markers\": [\n    {\n      \"id\": 1,\n      \"name\": \"India\",\n      \"color\": \"#22c55e\",\n      \"coordinates\": [\n        77.2090,\n        28.6139\n      ],\n      \"tooltip\": {\n        \"title\": \"New Delhi, India\",\n        \"fields\": [\n          {\n            \"key\": \"Country\",\n            \"value\": \"India\"\n          },\n          {\n            \"key\": \"Capital\",\n            \"value\": \"New Delhi\"\n          }\n        ]\n      }\n    },\n    {\n      \"id\": 2,\n      \"name\": \"Thailand\",\n      \"color\": \"#22c55e\" …(trimmed)
```

### `controlDrawer` · 1079
```json
{"actionType":"controlDrawer","id":"act_tXWds","payload":{"drawerId":"b_OJas2","operation":"hide","method":"trigger"}}
```
```json
{"actionType":"controlDrawer","executionType":"delay","id":"act_86Zvj","payload":{"drawerId":"b_OJas2","operation":"show","method":"trigger"}}
```

### `emitPageEvent` · 558
```json
{"actionType":"emitPageEvent","executionType":"delay","delayDuration":200,"id":"act_AUcqj","payload":{"eventType":"p_evt_1pGSG","eventPayload":{"Message":"Go-Pursue"}}}
```
```json
{"actionType":"emitPageEvent","executionType":"delay","delayDuration":200,"id":"act_AUcqj","payload":{"eventType":"p_evt_1pGSG","eventPayload":{"Message":"Go-Pursue"}}}
```

### `controlUser` · 498
```json
{"actionType":"controlUser","id":"act_5PuzP","payload":{"userControlAction":"setLanguage","language":"en-US","variableId":"var_uCuBT","method":"trigger","operationDetails":{"operation":"SET","value":"En"}},"onSuccessActions":[]}
```
```json
{"actionType":"controlUser","id":"act_JW9Eu","payload":{"userControlAction":"setLanguage","language":"ar-AE","variableId":"var_uCuBT","method":"trigger","operationDetails":{"operation":"SET","value":"Ar"}},"onSuccessActions":[]}
```

### `navigate` · 450
```json
{"actionType":"navigate","payload":{"path":"mailto: <email>","history":"push","preserveSearchParams":false,"target":"_blank"},"id":"act_kTDyr"}
```
```json
{"actionType":"navigate","id":"act_FmhI8","payload":{"path":"tel:<number>","history":"push","preserveSearchParams":false,"target":"_blank"}}
```

### `triggerFunction` · 426
```json
{"actionType":"triggerFunction","executionType":"delay","id":"act_D60GD","payload":{"functionId":"func_HfPHI"},"onSuccessActions":[],"delayDuration":200}
```
```json
{"actionType":"triggerFunction","executionType":"delay","id":"act_U1BIe","payload":{"functionId":"func_LOSN9"},"onSuccessActions":[{"id":"act_R5MKm","actionType":"setPageVariable","payload":{"variableId":"var_91aNn","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ func_LOSN9['value']['today']['date'] }}"}},"executionType":"delay"},{"id":"act_n5qk1","actionType":"setPageVariable","payload":{"variableId":"var_48ork","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ func_LOSN9['value']['today']['date'] }}"}},"executionType":"delay"}]}
```

### `submitForm` · 217
```json
{"actionType":"submitForm","payload":{"formId":"b_rcEUD","method":"trigger"},"id":"act_v2eVt"}
```
```json
{"actionType":"submitForm","id":"act_HWkbr","payload":{"formId":"b_Qezjy","method":"trigger"},"onSuccessActions":[{"actionType":"setPageVariable","id":"act_QiWcq","payload":{"variableId":"var_1jCag","method":"setPageVariable","operationDetails":{"operation":"SET","value":"BeforeOTPVerification"}}},{"actionType":"setPageVariable","id":"act_RmRBs","payload":{"variableId":"var_cYcbC","method":"setPageVariable","operationDetails":{"operation":"SET","value":"UpdateMobileNo"}}},{"actionType":"setPageVariable","id":"act_3uAbV","payload":{"variableId":"var_GR2hD","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ b_Qezjy['data']['F_BUoLj'] }}"}}},{"actionType":"setPageVariable","id":"act_FPDak","payload":{"variableId":"var_SZu42","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ b_Qezjy['data']['F_Ww5Ef'] }}"}}},{"actionType":"setPageVariable","id":"act_H94sw","payload":{"variableId":"var_NtORl","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ b_Qezjy['data']['F_yTbAO']['phoneNumber'] }}"}}},{"actionType":"setPageVariable","id":"act_YnN4L","payload":{"variableId":"var_2dnfA","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ b_Qezjy['data']['F_XXjKE'] }}"}}},{"actionType":"controlDataSource","id":"act_YuuLd","payload":{"dataSourceId":"e_68f49c59d985c52d8c7fce2e","method":"trigger"}}]}
```

### `navigateBack` · 210
```json
{"actionType":"navigateBack","payload":{"navigateToSpecificPage":true,"pageId":"mobileapp_login","pageInputs":{"NoContextUser":"{{ pageInputs['NoContextUser'] }}"},"history":"push","target":"_self"},"id":"act_iyCUT","runCondition":{"type":"filter","payload":{"filters":[{"filters":[{"property":"{{ var_geaLJ['value'] }}","filter":{"operator":"EQUAL","value":"mobile_number"}},{"property":"{{ pageInputs['1001_code_handling'] }}","filter":{"operator":"EQUAL","value":"null"}}],"operator":"AND"},{"property":"{{ pageInputs['1001_code_handling'] }}","filter":{"operator":"EQUAL","value":"email"}},{"property":"{{ pageInputs['1001_code_handling'] }}","filter":{"operator":"EQUAL","value":"mobile"}}],"operator":"OR"}}}
```
```json
{"actionType":"navigateBack","payload":{"navigateToSpecificPage":true,"pageId":"mobileapp_login","pageInputs":{"NoContextUser":"false"},"target":"_self","history":"replace"},"onSuccessActions":[],"id":"act_ZVtjX"}
```

### `controlBottomSheet` · 116
```json
{"actionType":"controlBottomSheet","id":"act_ydxNi","payload":{"bottomSheetId":"b_uJjeA","operation":"hide","pageId":"e_69d78abbe1b23714213f26d2","target":"_self","history":"push"},"onSuccessActions":[{"actionType":"navigateToPage","id":"act_YULpL","payload":{"pageId":"e_69d78abbe1b23714213f26d2","target":"_self","history":"push"}}]}
```
```json
{"actionType":"controlBottomSheet","id":"act_ydxNi","payload":{"bottomSheetId":"b_c12cE","operation":"hide","pageId":"e_69d78abbe1b23714213f26d2","target":"_self","history":"push"},"onSuccessActions":[{"actionType":"navigateToPage","id":"act_YULpL","payload":{"pageId":"e_69d78abbe1b23714213f26d2","target":"_self","history":"push"}}]}
```

### `controlMediaUploads` · 110
```json
{"actionType":"controlMediaUploads","executionType":"delay","id":"act_nTBDp","payload":{"method":"trigger","operation":"uploadFiles","config":{"supportedFileTypes":[".png","image/jpeg","image/jpg",".svg","image/*"],"multipleFiles":false,"maxFileSize":100,"fileVisibility":"RESTRICTED"}},"onSuccessActions":[{"id":"act_IdO6f","actionType":"setPageVariable","payload":{"variableId":"var_nXfgj","method":"setPageVariable","operationDetails":{"operation":"SET","value":"true"}},"executionType":"delay"},{"id":"act_M0g9y","actionType":"setPageVariable","payload":{"variableId":"var_2zct9","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ mediaUploads['b_NBDzm'][0]['url'] }}"}},"executionType":"delay"},{"id":"act_8vqem","actionType":"controlDataSource","executionType":"delay","payload":{"dataSourceId":"e_6a5103d2d46d4e608bc56918","method":"trigger"}}],"onErrorActions":[]}
```
```json
{"actionType":"controlMediaUploads","id":"act_3E5IR","payload":{"operation":"uploadFiles","config":{"supportedFileTypes":["*"],"multipleFiles":true,"fileVisibility":"RESTRICTED"},"allowDownload":true,"method":"trigger"},"onSuccessActions":[{"actionType":"controlDataSource","id":"act_v0mw7","payload":{"dataSourceId":"e_69d3f172291a3e43dc432174","method":"trigger"}}]}
```

### `setInterfaceSessionStorage` · 91
```json
{"actionType":"setInterfaceSessionStorage","id":"act_CnHrj","payload":{"operation":"SET_IN","path":"is_declined_premium","value":"true","method":"trigger"}}
```
```json
{"actionType":"setInterfaceSessionStorage","executionType":"delay","id":"act_oqy83","payload":{"operation":"SET_IN","path":"{{ sessionStorage['is_accepted_updated_premium'] }}","value":"false","method":"trigger"},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ var_iFBcR['value']['application_result_UW'] }}","filter":{"operator":"MISSING"}}],"operator":"AND"}}}
```

### `copyToClipboard` · 70
```json
{"actionType":"copyToClipboard","executionType":"delay","id":"act_5QNyu","onSuccessActions":[{"id":"act_k77T3","actionType":"setPageVariable","payload":{"variableId":"var_lezGU","method":"setPageVariable","operationDetails":{"operation":"SET","value":"true"}},"executionType":"delay"},{"id":"act_4VqtX","actionType":"setPageVariable","payload":{"variableId":"var_lezGU","method":"setPageVariable","operationDetails":{"operation":"SET","value":"false"}},"executionType":"delay","delayDuration":1000},{"id":"act_myVQz","actionType":"controlBlockMethod","payload":{"blockId":"b_SQuKk","methodName":"hideContextualDialog"},"executionType":"delay"}],"payload":{"value":"{{\n    function(){\nconst isOwnerUser = String(var_hm4Ma['value']['ownerUserId']) === userContext['id'];\nconst domain = queryMeta['domain'];\nconst pathName = location['pathname'];\n\nconst isUniqueNamePresent = var_hm4Ma['value']['properties']['uniqueName'];\n\n    if(isOwnerUser || !isUniqueNamePresent) {\n        const homepageBasePath = pathName.replace('/playbooks', '/homepage');\n        const url = `${domain}${homepageBasePath}?isArtifactPreview=true&initialChatId=${var_hm4Ma['value']['properties']['caseId']}&artifactId=${var_hm4Ma['value']['id']}`;\n        return url;\n    }\nconst artifactName = var_hm4Ma['value']['properties']['uniqueName'];\n\nconst url = `${domain}${pathName}/${artifactName}/details?isArtifactPreview=true`;\nreturn url;\n}()\n}}"}}
```
```json
{"actionType":"copyToClipboard","executionType":"delay","id":"act_5QNyu","onSuccessActions":[{"id":"act_k77T3","actionType":"setPageVariable","payload":{"variableId":"var_lezGU","method":"setPageVariable","operationDetails":{"operation":"SET","value":"true"}},"executionType":"delay"},{"id":"act_4VqtX","actionType":"setPageVariable","payload":{"variableId":"var_lezGU","method":"setPageVariable","operationDetails":{"operation":"SET","value":"false"}},"executionType":"delay","delayDuration":1000},{"id":"act_myVQz","actionType":"controlBlockMethod","payload":{"blockId":"b_SQuKk","methodName":"hideContextualDialog"},"executionType":"delay"}],"payload":{"value":"{{\n    function(){\nconst isOwnerUser = String(var_hm4Ma['value']['ownerUserId']) === userContext['id'];\nconst domain = queryMeta['domain'];\nconst pathName = location['pathname'];\n\nconst isUniqueNamePresent = var_hm4Ma['value']['properties']['uniqueName'];\n\n    if(isOwnerUser || !isUniqueNamePresent) {\n        const homepageBasePath = pathName.replace('/artifacts', '/homepage');\n        const url = `${domain}${homepageBasePath}?isArtifactPreview=true&initialChatId=${var_hm4Ma['value']['properties']['caseId']}&artifactId=${var_hm4Ma['value']['id']}`;\n        return url;\n    }\nconst artifactName = var_hm4Ma['value']['properties']['uniqueName'];\n\nconst url = `${domain}${pathName}/${artifactName}/details?isArtifactPreview=true`;\nreturn url;\n}()\n}}"}}
```

### `downloadFile` · 68
```json
{"actionType":"downloadFile","executionType":"delay","id":"act_15IE3","onSuccessActions":[{"id":"act_oeanI","actionType":"controlBlockMethod","payload":{"blockId":"b_SQuKk","methodName":"hideContextualDialog"},"executionType":"delay"}],"payload":{"url":"{{ var_hm4Ma['value']['properties']['pageInputs']['downloadUrl'] }}","fileName":"{{ var_hm4Ma['value']['properties']['pageInputs']['description']['name'] }}"}}
```
```json
{"actionType":"downloadFile","executionType":"delay","id":"act_15IE3","onSuccessActions":[{"id":"act_oeanI","actionType":"controlBlockMethod","payload":{"blockId":"b_SQuKk","methodName":"hideContextualDialog"},"executionType":"delay"}],"payload":{"url":"{{ var_hm4Ma['value']['properties']['pageInputs']['downloadUrl'] }}","fileName":"{{ var_hm4Ma['value']['properties']['pageInputs']['description']['name'] }}"}}
```

### `controlMediaViewer` · 48
```json
{"actionType":"controlMediaViewer","id":"act_DKz4F","payload":{"url":"<url>","allowDownload":true,"method":"trigger"}}
```
```json
{"actionType":"controlMediaViewer","id":"act_DKz4F","payload":{"url":"<url>","allowDownload":true,"method":"trigger"}}
```

### `setURLParameters` · 37
```json
{"actionType":"setURLParameters","id":"act_Y3Ko4","payload":{"pageInputs":{"initialChatId":"{{}}"},"mergeWithExistingQueryParams":false,"history":"push"},"onSuccessActions":[],"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ location['search'] }}","filter":{"operator":"CONTAINS","value":"initialChatId"}}],"operator":"AND"}}}
```
```json
{"actionType":"setURLParameters","id":"act_Ui3sp","payload":{"pageInputs":{"initialChatMessage":"{{}}"},"mergeWithExistingQueryParams":true,"history":"push"},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ pageInputs['initialChatMessage'] }}","filter":{"operator":"EXISTS"}}],"operator":"AND"}},"onSuccessActions":[]}
```

### `shareEntityRecord` · 33
```json
{"actionType":"shareEntityRecord","executionType":"delay","id":"act_uHnR3","payload":{"entityType":"service_hub_case","variant":"MODAL","modalVariant":"GENERAL_ACCESS","method":"trigger","entityId":"{{ b_WCebk['chatId'] }}","title":"Share Chat","allowedRoleIds":["6a5f34e8dfefae3f17b5446b","6a5f352bdfefae3f17b5446c","6a5f35b0dfefae3f17b5446f"],"defaultRoleId":"6a5f34e8dfefae3f17b5446b"},"onSuccessActions":[{"id":"act_slKge","actionType":"controlDataSource","payload":{"dataSourceId":"e_6aa5942e3f2351706d5b95e1","method":"trigger"},"executionType":"delay"}]}
```
```json
{"actionType":"shareEntityRecord","id":"act_WTkab","payload":{"entityType":"service_hub_case","entityId":"{{ b_WCebk['chatId'] }}","variant":"MODAL","anchorBlockId":"b_OiHCt","title":"Share Chat","allowedRoleIds":["6a5f34e8dfefae3f17b5446b","6a5f352bdfefae3f17b5446c","6a5f35b0dfefae3f17b5446f"],"method":"trigger","defaultRoleId":"6a5f34e8dfefae3f17b5446b","modalVariant":"GENERAL_ACCESS"},"executionType":"delay"}
```

### `controlNotification` · 26
```json
{"actionType":"controlNotification","id":"act_LPpmK","payload":{"operation":"open","leftOffset":"{{ var_WcXig['value'] ? 280 : interfaceRecord['navigation']?.['dimensions']?.['width'] }}","method":"trigger"},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ b_2tCzj['context']['item']['type'] }}","filter":{"operator":"EQUAL","value":"ACTION"}},{"property":"{{ b_2tCzj['context']['item']['action'] }}","filter":{"operator":"EQUAL","value":"showNotifications"}}],"operator":"AND"}}}
```
```json
{"actionType":"controlNotification","id":"act_N6rFr","payload":{"operation":"close","method":"trigger"}}
```

### `setLocalStorage` · 20
```json
{"actionType":"setLocalStorage","id":"act_NLvfY","payload":{"operation":"SET","key":"forgotpassword","value":"true","method":"trigger"},"onSuccessActions":[{"actionType":"navigateToPage","id":"act_sBkuS","payload":{"pageId":"mobileapp_login","target":"_self","pageInputs":{"NoContextUser":"true"},"history":"replace"}}]}
```
```json
{"actionType":"setLocalStorage","id":"act_Be2mb","payload":{"operation":"SET","key":"language","value":"En","method":"trigger"}}
```

### `sendMQTTEvent` · 4
```json
{"actionType":"sendMQTTEvent","executionType":"delay","id":"act_7Jash","payload":{}}
```
```json
{"actionType":"sendMQTTEvent","id":"act_7LoA4","payload":{"topicId":"mqttTopic_i7a1A","eventPayload":{"send_message":"Validate the details"},"method":"trigger"},"onSuccessActions":[]}
```

### `manageBiometrics` · 3
```json
{"actionType":"manageBiometrics","payload":{"method":"verify"},"onSuccessActions":[{"actionType":"setPageVariable","id":"act_JKQE2","payload":{"variableId":"var_j9Xld","method":"setPageVariable","operationDetails":{"operation":"SET","value":"true"}}},{"actionType":"controlDataSource","id":"act_jbLt9","payload":{"dataSourceId":"e_69038e64d985c52d8c7fdabe","method":"trigger"}}],"id":"act_Txnlt","onErrorActions":[]}
```
```json
{"actionType":"manageBiometrics","payload":{"method":"enroll","modalId":"b_AVIdd","operation":"hide"},"onSuccessActions":[{"actionType":"controlDataSource","payload":{"dataSourceId":"e_68cfdd43a23d8a0c8881605b","method":"trigger"},"id":"act_7hWFv"}],"id":"act_EeL7j","onErrorActions":[{"actionType":"setLocalStorage","id":"act_Y1Twn","payload":{"operation":"SET","key":"IsBiometricSet","value":"false"}},{"actionType":"showNotification","id":"act_42Yhe","payload":{"title":"Something went wrong. Please try again","type":"error","position":"top-center","method":"trigger"}}]}
```

### `sendCustomEvent` · 2
```json
{"actionType":"sendCustomEvent","id":"act_c7g8o","payload":{"eventId":"customEvent_EKZV4","method":"trigger"}}
```
```json
{"actionType":"sendCustomEvent","executionType":"delay","id":"act_s9U4r","payload":{"eventId":"customEvent_NprdP"}}
```

### `exportData` · 1
```json
{"actionType":"exportData","payload":{"fileName":"Transcript File","method":"trigger","data":"{{[ { \"speaker\": \"Brodie McCloy\", \"text\": \"Hello, I'm Brodie, a third-year medical student at Trinity. This is a demo of how Zoom interviews will go.\" }, { \"speaker\": \"Speaker 2\", \"text\": \"Nice to see you, Brodie. I'll transfer you to the waiting room.\" }, { \"speaker\": \"Mary\", \"text\": \"Hi, I'm Mary, a student helper. Can you hear and see me okay?\" }, { \"speaker\": \"Brodie McCloy\", \"text\": \"Yes, I can.\" }, { \"speaker\": \"Mary\", \"text\": \"Great. You're here for Natural Sciences and need a drawing tablet, right?\" }, { \"speaker\": \"Brodie McCloy\", \"text\": \"Yes, I have it.\" }, { \"speaker\": \"Aleks\", \"text\": \"I'm Aleks, theoretical chemist. Let's start with ionic bonding—what do you know about it?\" }, { \"speaker\": \"Brodie McCloy\", \"text\": \"It's a bond formed by transfer of charge between ions, held by electrostatic attraction.\" }, { \"speaker\": \"Cate\", \"text\": \"Thanks, Brodie. Any questions for us before we finish?\" }, { \"speaker\": \"Brodie McCloy\", \"text\": \"No, thank you. It was a helpful experience.\" } ]}}","fileType":"CSV"},"id":"act_WQ3tN"}
```

### `controlStep` · 1
```json
{"actionType":"controlStep","id":"act_Ij4UB","payload":{"method":"nextStep"}}
```

### `controlBuild` · 1
```json
{"actionType":"controlBuild","id":"act_9NlER","payload":{"buildControlAction":"openDebugMenu","method":"trigger"}}
```

### `openShareDialog` · 1
```json
{"actionType":"openShareDialog","executionType":"delay","id":"act_T8atH","payload":{"message":"share m","method":"trigger"}}
```
