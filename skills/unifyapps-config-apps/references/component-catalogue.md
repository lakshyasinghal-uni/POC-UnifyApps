# Component catalogue — harvested from real config apps

Generated 2026-09-23 from **252,982 blocks on 2,203 pages of the 80 largest published config apps** on
orbit.uat (read-only harvest). For each component type: how often it is used, the `content` / `appearance`
keys seen (most common first) and one real block, trimmed. These are the shapes the platform itself writes.

Custom components appear under their manifest `type` as the componentType (e.g. `tryComp`, `StackedTile`,
`leaderboard`) with `content {type:"CUSTOM_BLOCK_TYPE", entityId, version, data}` — see `custom-components.md`.

## Index

Stack (108032), Typography (80032), Button (9711), Card (9397), Icon (9016), IconButton (3595), Image (3241), Tag (3137), SingleSelect (2647), Repeatable (2623), TextInput (2486), Form (1573), Divider (1561), Modal (1150), Table (1104), Module (1097), Container (1038), TemplateComponent (950), Chart (865), Drawer (806), Checkbox (788), Loader (766), TextArea (753), Avatar (678), ProgressBar (582), StatCard (541), KeyValue (498), ContextualDialog (496), RadioButton (370), Pressable (332), Link (286), ButtonGroup (284), Filters (241), Tabs (193), FileUpload (161), Toggle (155), CopilotInput (124), Calendar (119), Copilot (117), LottieAnimation (105), Alert (90), Stepper (81), RichText (78), Timer (77), PDFViewer (66), Timeline (64), Menu (63), BottomSheet (58), Slider (53), Carousel (52), Iframe (48), SteppedContainer (48), StepIndicator (45), StepSeparator (43), StepperV2 (41), AudioPlayer (33), Rating (31), Dictation (29), Video (23), CopilotVideo (16), MessageInput (16), AvatarGroup (16), Comments (14), Camera (12), InteractiveRegionsMap (11), Media (11), NestedTable (11), CopilotVoice (9), Navigation (8), Scrollable (8), EventsTimeline (8), OrganizationChart (7), CopilotVoiceTranscripts (7), EventsCalendar (6), PinInput (6), tryComp (6), Scanner (6), NavigationContainer (6), CodeEditor (5), StackedTile (5), SonyForm (5), RoutineEditor (4), RoutinesManager (4), ListingsMap (4), TriconMap (4), AudioRecorder (4), ArtifactPreview (3), ChatComments (3), LiveCollaborators (3), USAInteractiveMap (3), GanttChart (3), SimpleAgentBuilder (3), SwipeableStack (3), TreeView (3), leaderboard (3), CommentList (3), CommentInput (3), Kanban (3), CategoryFilter (3), SirionGantt (3), AxisNewIssueModal (3), RoutineSummary (2), RoutineRuns (2), RoutineTemplates (2), RoutineDetails (2), SkillEditor (2), FlippableCard (2), InventoryList (2), Meeting (2), CopilotHistory (2), CodeDiffEditor (2), SlotOutlet (2), GroupTable (2), MeetingDetails (1), MeetingsList (1), QRCode (1), FloatingActionButton (1), HeadlessCopilot (1), ProjectPlanBoard (1), MilestonePlan (1), DesignStudioWorkflow (1), SirionWorkflowBuilder (1), MultiStatsCard (1), SheetPreview (1), Keka_Nav (1), SidebarNavigation (1), CopilotVoiceCenterSpeaker (1), NestedEditableTable (1), MuiDateRangePicker (1), CustomFilter (1), Chat (1), Barcode (1), PhoneNumber (1), ImageGrid (1)

## Stack  ·  108032 blocks
- **content**: blockIds, addOns
- **appearance**: direction, alignItems, styles, justifyContent, reverseOrder, wrapContent, theme, effects, customStyles, additional, events, slots, content
```json
{"component":{"componentType":"Stack","appearance":{"alignItems":"flex-start","reverseOrder":false,"styles":{"padding":{"all":"p-0"},"margin":{"all":"m-0"},"backgroundColor":"bg-transparent","borderColor":"border-transparent","backgroundImage":"","minWidth":"none","minHeight":"none","layout":"flex-shrink-0","overflow":{"all":"overflow-visible"},"borderRadius":{"all":"rounded-none"},"flexWrap":"flex-nowrap","maxHeight":"none","borderWidth":{"all":"border-0"},"gap":{"all":"gap-0"},"width":"w-full","breakAfter":"break-after-auto","backgroundSize":"bg-auto","position":"static","backgroundRepeat":"bg-repeat","maxWidth":"none","height":"h-auto"},"theme":"inherit","wrapContent":true,"justifyContent":"flex-start","direction":"column"},"content":{"blockIds":["b_6h5A2","__PLACEHOLDER__"]}},"visibility":{"value":true},"dpOn":[],"displayName":"body11","dataSourceIds":[],"id":"b_gvhIQ","parentId":"b_3kq4K","v":0}
```

## Typography  ·  80032 blocks
- **content**: type, value, addOns, optionsType, searchType, searchBy, options, preserveNewline
- **appearance**: color, variant, weight, align, preserveNewline, styles, typography, fontFamily, customStyles, showTooltipOnTextOverflow, tooltipPlacement, textTransform, letterSpacing, lineHeight, fontStyle, textDecoration, theme, fontSize
- **addOns**: truncation
```json
{"component":{"componentType":"Typography","content":{"value":"{{ var_wCJ7c['value']['title']['text'] }}","type":"PLAIN_TEXT"},"appearance":{"weight":"regular","variant":"display-lg","color":"text-primary","align":"left"},"slots":{}},"id":"b_IqnCK","visibility":{"value":true},"v":0,"parentId":"b_5hqng","dataSourceIds":[],"dpOn":[{"id":"var_wCJ7c","p":["var_wCJ7c['value']['title']['text']"]}],"additional":{"customCSS":"[data-block-id='b_IqnCK'] {\n  /* Add your custom styles here */\n  font-family: Spectral;\n  background: linear-gradient(135deg, #FFF 0%, #FFF 38.9%, #F5F1E9 70.72%);\nbackground-clip: text;\n-webkit-background-clip: text;\n-webkit-text-fill-color: transparent;\n}","isCustomCSSValid":true},"displayName":"text23","dP":[{"p":"content.value"}]}
```

## Button  ·  9711 blocks
- **content**: value, type, contentMode, addOns, formBlockId, label
- **appearance**: variant, size, color, styles, startDecorator, disabled, loading, endDecorator, customStyles, border-radius, theme, destructive, floatingButton, OnColour
```json
{"component":{"componentType":"Button","content":{"contentMode":"text","value":"{{ var_NYx3E['value']?.['uiConfig']?.['button']?.['value']?? var_NYx3E['value']?.['name'] ?? \"Login via OTP\" }}","type":"default"},"appearance":{"color":"neutral","size":"lg","variant":"outline","startDecorator":"{{ var_NYx3E['value']?.['iconUrl'] ?? var_NYx3E['value']?.['uiConfig']?.['button']?.['startDecoratorComponent'] }}","destructive":"true","floatingButton":"true","OnColour":"true_On","styles":{}},"slots":{}},"id":"b_t2D4C","visibility":{"value":true},"v":0,"dpOn":[{"id":"var_NYx3E","p":["var_NYx3E['value']['uiConfig']['button']['value']","var_NYx3E['value']['name']","var_NYx3E['value']['iconUrl']","var_NYx3E['value']['uiConfig']['button']['startDecoratorComponent']"]}],"parentId":"b_52pCg","dataSourceIds":[],"events":[{"eventType":"onClick","action":{"actionType":"setPageVariable","executionType":"delay","id":"act_jbipY","payload":{"variableId":"var_voB92","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ var_NYx3E['value']?.['id'] }}"}},"onSuccessActions":[{"actionType":"setPageVariable","executionType":"delay","id":"act_igd3L","payload":{"variableId":"var_GtczB","method":"setPageVariable","operationDetails":{"operation":"SET","value":"otp"}}}]},"id":"evt_r7pwf"},{"eventType":"onClick","action":{"actionType":"setPageVariable","executionType":"delay","id":"act_rMhNF","payload":{"variableId":"var_GtczB","method":"setPageVariable","operationDetails":{"operation":"SET","value":"otp"}}},"id":"evt_ITWz0"}],"dP":[{"p":"content.value"},{"p":"appearance.startDecorator"}],"additional":{"customCSS":".ua-button[data-block-id='b_t2D4C'] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding-top: 8px;\n  padding-bottom: 8px;\n  height: 40px;\n  font-family: Inter;\n  font-size: 14px;\n  font-style: normal;\n  font-weight: 500;\n  line-height: 20px;\n\n  /* 142.857% */\n  span {\n    position: absolute;\n    left: 12px;\n  }\n\n  span>svg {\n    height: 16px;\n    width: 16px;\n  }\n}","isCustomCSSValid":true},"displayName":"button31"}
```

## Card  ·  9397 blocks
- **content**: collapsible, addOns, actions, schema
- **appearance**: styles, showDivider, theme, direction, alignItems, justifyContent, reverseOrder, wrapContent, customStyles
```json
{"component":{"componentType":"Card","slots":{"body":{"blockId":"b_gvhIQ","wrappedInLayout":true}},"appearance":{"showDivider":true,"styles":{"padding":{"all":"p-0"},"boxShadow":"shadow-sm","backgroundColor":"bg-transparent","margin":{"all":"m-0"},"borderColor":"border-transparent","visibility":"visible","backgroundImage":"","minWidth":"none","minHeight":"none","layout":"flex-shrink-0","overflow":{"all":"overflow-visible"},"borderRadius":{"all":"rounded-none"},"maxHeight":"none","borderWidth":{"all":"border-0"},"gap":{"all":"gap-0"},"width":"w-full","breakAfter":"break-after-auto","backgroundSize":"bg-auto","backgroundRepeat":"bg-repeat","maxWidth":"none","height":"h-auto"},"theme":"inherit"},"content":{"collapsible":{"isInitiallyExpanded":true,"enabled":false}}},"visibility":{"conditions":{"type":"filter","payload":{"filters":[{"filters":[{"property":"{{ e_6a9da27f035a7a40f27693e1['error']['message'] }}","filter":{"operator":"EXISTS"}},{"property":"{{ var_1v45w['value'] }}","filter":{"operator":"EXISTS"}}],"operator":"AND"},{"property":"{{ pageInputs['errorMessage'] }}","filter":{"operator":"EXISTS"}}],"operator":"OR"}},"value":"conditions"},"dpOn":[{"id":"e_6a9da27f035a7a40f27693e1","p":["e_6a9da27f035a7a40f27693e1['error']['message']"]},{"id":"var_1v45w","p":["var_1v45w['value']"]},{"id":"pageInputs","p":["pageInputs['errorMessage']"]}],"dataSourceIds":["e_6a9da27f035a7a40f27693e1"],"id":"b_3kq4K","parentId":"b_yoTaf","cP":[{"p":"visibility.conditions"}],"dP":[{"p":"visibility.conditions.payload.filters[0].filters[0].property"},{"p":"visibility.conditions.payload.filters[0].filters[1].property"},{"p":"visibility.conditions.payload.filters[1].property"}],"v":0,"displayName":"card16"}
```

## Icon  ·  9016 blocks
- **content**: icon, addOns, transparent
- **appearance**: size, variant, transparent, featured, styles, customStyles, theme
```json
{"component":{"componentType":"Icon","content":{"icon":"SvgCheck"},"appearance":{"size":"sm","transparent":{"color":"text-white"},"variant":"transparent","featured":{"color":"white"}}},"id":"b_gqbrA","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_RAq8d","dataSourceIds":[],"displayName":"icon15"}
```

## IconButton  ·  3595 blocks
- **content**: icon, addOns, label
- **appearance**: size, variant, color, styles, disabled, loading, customStyles, theme
```json
{"component":{"componentType":"IconButton","content":{"icon":"SvgAward01"},"appearance":{"color":"brand","size":"lg","variant":"soft"}},"displayName":"rewardsIcon","id":"b_2jAgp","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_JXmoX","dataSourceIds":[],"events":[{"eventType":"onClick","action":{"actionType":"navigateToPage","executionType":"delay","id":"act_8LE1W","payload":{"pageId":"e_6a0d486dba2bfc7fab087e9f","target":"_self","history":"push"}},"id":"evt_dFhOJ","disabled":true},{"eventType":"onClick","action":{"actionType":"navigate","executionType":"delay","id":"act_hIBG1","payload":{"path":"<url>","history":"replace","preserveSearchParams":false,"target":"_blank"},"onSuccessActions":[]},"id":"evt_7zN6T","disabled":false}]}
```

## Image  ·  3241 blocks
- **content**: data, src, alt, addOns
- **appearance**: objectFit, styles, customStyles
```json
{"component":{"componentType":"Image","appearance":{"objectFit":"object-scale-down","styles":{"layout":"flex-shrink-0","width":{"custom":"24px"},"height":{"custom":"Auto"}}},"content":{"data":{"uploadDetails":{"size":1152,"sourceType":"CLOUD_STORAGE","meta":{"previewUrl":"blob:<url>","queryMeta":{},"useExternalApi":false,"relativePath":"","name":"IC.svg","publicAcl":false,"type":"image/svg+xml","uri":"","referenceId":"b_MgKRL","cacheControl":"max-age=31536000,public,immutable"},"name":"IC.svg","progress":100,"isUploaded":true,"id":"uppy-ic/svg-1e-image/svg+xml--1152-1758582054000","source":"user-uploads/1/1758582085745/IC.svg","mimeType":"image/svg+xml","type":"FILE","url":"<url>","fileType":"svg"},"src":"https://assets.unifyapps.com/user-uploads/untitled+folder/IC.svg","alt":"placeholder","type":"URL"}}},"visibility":{"value":true},"dpOn":[],"v":0,"dataSourceIds":[],"id":"b_MgKRL","parentId":"b_P9PQE","displayName":"image42"}
```

## Tag  ·  3137 blocks
- **content**: label, tooltip
- **appearance**: size, variant, color, shape, startDecorator, decorators, isDot, disabled, endDecorator, styles
```json
{"component":{"componentType":"Tag","content":{"label":"{{ e_6aa9242635de182697a747b2['data']['status'] === 'PENDING' ? (e_6aa9242635de182697a747b2['data']['stage'] === 'HR' ? 'Pending HR' : 'Pending manager') : e_6aa9242635de182697a747b2['data']['status'] === 'RETURNED' ? 'Needs your input' : e_6aa9242635de182697a747b2['data']['status'] === 'DELIVERED' ? 'Delivered' : e_6aa9242635de182697a747b2['data']['status'] === 'BLOCKED' ? 'On hold' : e_6aa9242635de182697a747b2['data']['status'] === 'REJECTED' ? 'Rejected' : e_6aa9242635de182697a747b2['data']['status'] }}"},"appearance":{"color":{"defaultValue":"warning","conditionalValueFilters":[{"propertyValue":"success","conditions":{"type":"filter","payload":{"operator":"AND","filters":[{"property":"{{ e_6aa9242635de182697a747b2['data']['status'] }}","filter":{"operator":"EQUAL","value":"DELIVERED"}}]}}},{"propertyValue":"error","conditions":{"type":"filter","payload":{"operator":"AND","filters":[{"property":"{{ e_6aa9242635de182697a747b2['data']['status'] }}","filter":{"operator":"IN","value":"{{ ['REJECTED','BLOCKED','FAILED'] }}"}}]}}},{"propertyValue":"violet","conditions":{"type":"filter","payload":{"operator":"AND","filters":[{"property":"{{ e_6aa9242635de182697a747b2['data']['status'] }}","filter":{"operator":"EQUAL","value":"RETURNED"}}]}}}]},"size":"md","variant":"soft","shape":"rounded","decorators":{"statusDot":true},"styles":{"layout":"flex-shrink-0"}}},"id":"b_k91ZX","v":0,"visibility":{"value":true},"parentId":"b_7DzXP","displayName":"bannerTag","dpOn":[{"id":"e_6aa9242635de182697a747b2","p":["e_6aa9242635de182697a747b2['data']['status']","e_6aa9242635de182697a747b2['data']['stage']"]}],"cP":[{"p":"appearance.color.conditionalValueFilters[0].conditions"},{"p":"appearance.color.conditionalValueFilters[1].conditions"},{"p":"appearance.color.conditionalValueFilters[2].conditions"}],"dP":[{"p":"content.label"},{"p":"appearance.color.conditionalValueFilters[0].conditions.payload.filters[0].property"},{"p":"appearance.color.conditionalValueFilters[1].conditions.payload.filters[0].property"},{"p":"appearance.color.conditionalValueFilters[1].conditions.payload.filters[0].filter.value"},{"p":"appearance.color.conditionalValueFilters[2].conditions.payload.filters[0].property"}],"dataSourceIds":["e_6aa9242635de182697a747b2"]}
```

## SingleSelect  ·  2647 blocks
- **content**: options, placeholder, optionsType, searchType, searchBy, defaultValue, label, foreignKeyReference, addOns, lookupLabel, value, description, optionsAddOns, filteredOptions, optionsDropdownStyles, help
- **appearance**: size, styles, variant, disabled, options, startDecorator
```json
{"component":{"componentType":"SingleSelect","content":{"placeholder":"Select a reason…","label":"","options":[{"value":"NO_OPEN_HEADCOUNT","label":"NO_OPEN_HEADCOUNT"},{"value":"BUDGET_CONSTRAINT","label":"BUDGET_CONSTRAINT"},{"value":"SKILLS_MISMATCH","label":"SKILLS_MISMATCH"},{"value":"ORG_CHANGE_PENDING","label":"ORG_CHANGE_PENDING"},{"value":"POLICY_NON_COMPLIANCE","label":"POLICY_NON_COMPLIANCE"},{"value":"DUPLICATE_REQUEST","label":"DUPLICATE_REQUEST"},{"value":"INCORRECT_EFFECTIVE_DATE","label":"INCORRECT_EFFECTIVE_DATE"},{"value":"INCORRECT_DESTINATION_ORG","label":"INCORRECT_DESTINATION_ORG"},{"value":"INSUFFICIENT_JUSTIFICATION","label":"INSUFFICIENT_JUSTIFICATION"},{"value":"MISSING_HANDOVER_DETAIL","label":"MISSING_HANDOVER_DETAIL"},{"value":"OTHER","label":"OTHER"}],"optionsType":"STATIC"},"appearance":{"styles":{"maxWidth":"none","width":"w-full"}}},"id":"b_PJ14q","v":0,"visibility":{"value":true},"parentId":"b_C1JGf","displayName":"amReasonSelect","dpOn":[],"dataSourceIds":[],"events":[{"eventType":"onChange","id":"evt_3QnEP","action":{"actionType":"setPageVariable","payload":{"variableId":"var_m8BXX","operationDetails":{"operation":"SET","value":"{{ b_PJ14q['value'] }}"}},"id":"act_zVsAL"}},{"eventType":"onChange","id":"evt_4F0TQ","action":{"actionType":"setPageVariable","payload":{"variableId":"var_VFylE","operationDetails":{"operation":"SET","value":""}},"id":"act_e5qWZ"}}]}
```

## Repeatable  ·  2623 blocks
- **content**: blockId, data, primaryKey, autoSelect, scrollable, collectChildStates, addOns, containerId, sortable, bounces, dragHandleBlockId
- **appearance**: layout, direction, styles, separator, columns, customStyles
```json
{"component":{"componentType":"Repeatable","content":{"data":"{{ var_3X0cd['value'] }}","blockId":"b_AZZdb","autoSelect":"none","scrollable":false,"primaryKey":{"key":"__index__","path":"__index__","originalPath":"__index__","originalKey":"__index__"}},"appearance":{"layout":"list","direction":"vertical","separator":{"enabled":true,"appearance":{"styles":{"backgroundColor":"bg-secondary","margin":{"t":"mt-0"}}}},"styles":{"gap":{"all":"gap-xl"},"width":"w-full","borderWidth":{"all":"0px"},"borderStyle":{"all":"border-solid"},"borderColor":{"all":{"custom":"var(--border-secondary)"}}}}},"id":"b_yTtMn","v":0,"dpOn":[{"id":"var_3X0cd","p":["var_3X0cd['value']","var_3X0cd['value'][0]['id']"]}],"dP":[{"p":"content.data"},{"p":"visibility.conditions.payload.filters[0].property"}],"parentId":"b_9D6im","dataSourceIds":[],"visibility":{"value":"conditions","conditions":{"type":"filter","payload":{"filters":[{"property":"{{ var_3X0cd['value'][0]['id'] }}","filter":{"operator":"EXISTS"}}],"operator":"AND"}}},"cP":[{"p":"visibility.conditions"}],"displayName":"passwordIdpButtonsCopy"}
```

## TextInput  ·  2486 blocks
- **content**: placeholder, addOns, defaultValue, value, label, disabled
- **appearance**: size, variant, styles, value, placeholder, autoFocus, autoSelect, inputBox, disabled, multiline, rows, readOnly, customStyles, loading
```json
{"id":"b_8Repb","parentId":"b_vIO1Q","displayName":"textInput1","dataSourceIds":[],"events":[{"id":"evt_ligL6","eventType":"onChange","action":{"actionType":"setPageVariable","executionType":"delay","id":"act_rKbGb","payload":{"method":"setPageVariable","variableId":"var_D2dL2","operationDetails":{"operation":"SET","value":"{{ b_8Repb['value'] }}"}}}}],"component":{"componentType":"TextInput","content":{"defaultValue":"{{ var_D2dL2['value'] }}","placeholder":"Search artifacts...","addOns":{"prefixIcon":{"name":"SvgSearchMd","visibility":{"value":true}},"suffixIcon":{"visibility":{"value":true},"name":"Cross"}}},"appearance":{"size":"sm","variant":"outlined","value":{"variant":"text-md","weight":"regular"},"placeholder":{"weight":"regular","align":"left"},"autoFocus":false,"autoSelect":false,"styles":{},"inputBox":{"padding":{"custom":{"t":"pt-xl","r":"pe-2xl","b":"pb-xl","l":"ps-2xl"}}}}},"visibility":{"value":false},"v":0,"dpOn":[{"id":"var_D2dL2","p":["var_D2dL2['value']"]}],"additional":{"customCSS":"[data-block-id='b_8Repb'] input {\n  padding-left: 6px;\n}\n\n[data-block-id='b_8Repb'] div {\n  border-radius: 16px;\n}\n\n[data-block-id='b_8Repb'] .MuiInput-root:focus-within {\n  border: 1px solid var(--palette-gray-300) !important;\n}\n\n[data-block-id='b_8Repb'] .MuiInput-root[data-state=default]:focus-within {\n  outline: none;\n}\n[data-block-id='b_8Repb'] {\n  position: relative;\n}","isCustomCSSValid":true},"dP":[{"p":"content.defaultValue"}]}
```

## Form  ·  1573 blocks
- **content**: schema, source, fieldsType, resetFormWhenHidden, action, defaultFormData, jsonSchema, uiSchema, entity, entityId, mappedFields, autocomplete, initialFormData
- **appearance**: styles, layout, fieldDescription, fieldTitle, autoFocus, disabled, customStyles, readOnly
```json
{"component":{"componentType":"Form","content":{"schema":{"schema":{"type":"object","properties":{},"additionalProperties":false}},"resetFormWhenHidden":true,"fieldsType":"manual","source":"custom"},"slots":{},"appearance":{"layout":"column","fieldDescription":{"variant":"inline"},"styles":{"padding":{"all":"p-md"}}}},"displayName":"preloadFormBlock","id":"b_cilTy","v":0,"dpOn":[],"parentId":"root_id","dataSourceIds":[],"additional":{"customCSS":"[data-block-id='b_cilTy'] {\n  /* Add your custom styles here */\n  display: none;\n}"}}
```

## Divider  ·  1561 blocks
- **content**: —
- **appearance**: orientation, styles, height, dividerStyle, theme, width
```json
{"id":"b_dh2Hj","parentId":"b_yJQ0y","displayName":"divider2","dataSourceIds":[],"component":{"componentType":"Divider","content":{},"appearance":{"orientation":"vertical","height":"h-[1px]","width":"w-[1px]","dividerStyle":"solid","styles":{"borderColor":"border-tertiary","margin":{"y":"my-xs"}},"theme":"inherit"},"slots":{}},"visibility":{"value":true},"v":0,"dpOn":[],"additional":{"customCSS":"[data-block-id='b_dh2Hj'] {\n  /* Add your custom styles here */\n  background: var(--Colors-Border-border-primary, #DBD6D1);\n\n\n}","isCustomCSSValid":true}}
```

## Modal  ·  1150 blocks
- **content**: hideOnEscape, variant, hideOnClickOutside, pageId, inputs
- **appearance**: width, height, styles, blurBackdrop
```json
{"component":{"componentType":"Modal","slots":{"body":{"blockId":"b_8XjDi","wrappedInLayout":true}},"appearance":{"width":{"custom":"94%"},"styles":{"borderRadius":{"all":"rounded-md"}},"height":"h-auto"},"content":{"hideOnEscape":true,"variant":"card","pageId":"","hideOnClickOutside":false}},"dpOn":[],"v":0,"displayName":"otpSubmissionLimit","additional":{},"dataSourceIds":[],"id":"b_T8Dsh","parentId":"root_id"}
```

## Table  ·  1104 blocks
- **content**: columns, data, rowActions, bulkActions, rowSelection, source, addOns, columnType, inputs, identifier, uaColumnOptions, entityId, dataSourceId, showSelectionColumn, isDataEmpty, subRows, mappedColumn, selectionDisabled
- **appearance**: rowHeight, gridLineAxis, styles, gridLineColor, headerAppearance, headerStyles, cellAppearance, cellStyles, wrapColumnHeader, enableStickyHeader, hideHeaders, selectedRowHoverColor, rowActions, rowHoverColor, showTableContainerBorder, emptyMessage, hideHeader, enableColumnOrdering
```json
{"component":{"componentType":"Table","slots":{},"content":{"data":"{{ var_Ba6lR['value'] }}","rowActions":[{"id":"_hbedt","label":"Edit","visibility":"VISIBLE","buttonType":"icon-button","appearance":{"icon":"Edit01","variant":"soft"}}],"bulkActions":[],"columns":[{"id":"_hbper","label":"Person","type":"TEXT_DESCRIPTION","fieldKey":{"path":"name","key":"name"},"addOns":{"description":"{{ b_ClyK6['context']['currentRow'][\"id\"] }}"},"columnComponentProps":{"appearance":{"width":220,"minWidth":160,"title":{"variant":"text-sm","weight":"medium","color":"text-primary"},"description":{"variant":"text-xs","weight":"regular","color":"text-tertiary","fontFamily":"font-mono"}}}},{"id":"_hbdep","label":"Department","type":"TEXT","fieldKey":{"path":"dept","key":"dept"},"columnComponentProps":{"appearance":{"width":180,"minWidth":120}}},{"id":"_hbdsg","label":"Designation","type":"TEXT","fieldKey":{"path":"designation","key":"designation"},"columnAddOns":{"tooltip":{"type":"overflow"}},"columnComponentProps":{"appearance":{"width":220,"minWidth":150,"grow":true}}},{"id":"_hbsig","label":"Signature","type":"TAG","fieldKey":{"path":"signature","key":"signature"},"addOns":{"colorMapping":{"On file":"success","Missing":"error"},"labelMapping":{}},"columnComponentProps":{"appearance":{"width":120,"minWidth":90,"tagColorvariant":"soft"}}},{"id":"_hbact","label":"Active","type":"TAG","fieldKey":{"path":"active","key":"active"},"addOns":{"colorMapping":{"Yes":"success","No":"error"},"labelMapping":{}},"columnComponentProps":{"appearance":{"width":90,"minWidth":70,"tagColorvariant":"soft"}}}],"identifier":{"path":"id","key":"id"},"rowSelection":"NONE","source":"mapped","addOns":{"layoutMode":"grid"}},"appearance":{"styles":{"gap":{"all":"gap-md"},"width":"w-full"},"rowHeight":"comfortable","gridLineAxis":"xBetween","enableStickyHeader":false}},"id":"b_ClyK6","v":0,"visibility":{"value":true},"displayName":"hrbpTable","dpOn":[{"id":"var_Ba6lR","p":["var_Ba6lR['value']"]}],"dP":[{"p":"content.data"},{"p":"content.columns[0].addOns.description"}],"dataSourceIds":[],"parentId":"b_C70oD","additional":{"htmlAttributes":[{"key":"data-evl","value":"uatbl"}]}}
```

## Module  ·  1097 blocks
- **content**: moduleId, moduleInterfaceRecordId, inputs, rememberStateWhenHidden
- **appearance**: styles, theme
```json
{"component":{"componentType":"Module","content":{"moduleId":"e_68dfc68264b5bc510a0ff07d","moduleInterfaceRecordId":"mobileapp"},"appearance":{"styles":{"height":"h-full","width":"w-full"}}},"id":"b_7ingd","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_06Nff","dataSourceIds":[],"displayName":"module5"}
```

## Container  ·  1038 blocks
- **content**: blockIds
- **appearance**: variant, styles, theme, customStyles
```json
{"component":{"componentType":"Container","appearance":{"variant":"1_1_1","styles":{"borderColor":"border-transparent","gap":{"all":"gap-sm"},"height":{"custom":"Auto"}},"theme":"inherit"},"content":{"blockIds":["b_oGBSW","b_SEZhz","b_sIuaS"]}},"visibility":{"value":true},"dpOn":[],"v":0,"displayName":"container3","dataSourceIds":[],"id":"b_UPM3Y","parentId":"b_gbwLi"}
```

## TemplateComponent  ·  950 blocks
- **content**: templateComponentId, templateInterfaceRecordId, inputs, componentOverrides, rememberStateWhenHidden, loading
- **appearance**: styles
```json
{"component":{"componentType":"TemplateComponent","content":{"templateComponentId":"e_6aa72381c5f3d070899e5dd7","inputs":{"image":"{{ b_GPJOp['context']['item'].model==='iPhone 17' ? 'https://buy.gazelle.com/cdn/shop/files/iPhone17-Black-Overlap-cropped.jpg?v=1759848700&width=720' : b_GPJOp['context']['item']['imageUrl'] }}","title":"{{ b_GPJOp['context']['item']['title'] }}","condition":"","price":"{{ b_GPJOp['context']['item']['price'] }}","compareAtPrice":"{{ b_GPJOp['context']['item']['compareAtPrice'] }}","rating":"{{ b_GPJOp['context']['item']['ratingAverage'] }}","reviewCount":"{{ b_GPJOp['context']['item']['reviewCount'] }}","href":"/products/{{ b_GPJOp['context']['item']['handle'] }}/details"}},"appearance":{"styles":{}}},"id":"b_OF9sf","v":0,"visibility":{"value":true},"displayName":"templateComponent2","dpOn":[{"id":"b_GPJOp","p":["b_GPJOp['context']['item'].model","b_GPJOp['context']['item']['imageUrl']","b_GPJOp['context']['item']['title']","b_GPJOp['context']['item']['price']","b_GPJOp['context']['item']['compareAtPrice']","b_GPJOp['context']['item']['ratingAverage']","b_GPJOp['context']['item']['reviewCount']","b_GPJOp['context']['item']['handle']"]}],"dP":[{"p":"content.inputs.image"},{"p":"content.inputs.title"},{"p":"content.inputs.price"},{"p":"content.inputs.compareAtPrice"},{"p":"content.inputs.rating"},{"p":"content.inputs.reviewCount"},{"p":"content.inputs.href"}],"dataSourceIds":[],"parentId":"b_GPJOp"}
```

## Chart  ·  865 blocks
- **content**: chartType, data, xAxis, yAxis, summary, yAxisRight, addOns, label, tooltip, rows, columns, chartLayout, chartColours, title, set, setSize, pointMarker, links, node, link, metricLabel
- **appearance**: styles, chartColours, legends, yAxis, xAxis, barWidth, stacked, showPointMarkers, angle, groupedBarsGap, yAxisRight, sliceWidth, commonYAxis, showTotal, interpolation, areaFill, heatmapColors, direction
```json
{"component":{"componentType":"Chart","content":{"chartType":"BAR","data":"{{ [{\"day\":\"Monday\",\"units\":200,\"unitsPurchased\":100},{\"day\":\"Tuesday\",\"units\":350,\"unitsPurchased\":250},{\"day\":\"Wednesday\",\"units\":450,\"unitsPurchased\":400},{\"day\":\"Thursday\",\"units\":220,\"unitsPurchased\":320},{\"day\":\"Friday\",\"units\":300,\"unitsPurchased\":340}] }}","xAxis":{"plotPeriodicValues":false,"xAxisValue":{"path":"day","key":"day","originalPath":"day","originalKey":"day"},"label":"Day","scale":"category","tickLabels":{}},"yAxis":{"series":[{"id":"series1","value":{"path":"units","key":"units","originalKey":"units","originalPath":"units"},"label":"Units Sold","dataLabels":{"enabled":true,"appearance":{"position":"outsideEnd","variant":"text-xxxs","weight":"regular"}},"appearance":{"visibility":{"value":true}}}],"label":"Units Sold","tickLabels":{"type":"NUMBER","notation":"standard","decimalPlaces":0}},"summary":{"items":[]}},"appearance":{"barWidth":"lg","styles":{"padding":{"all":"p-sm"},"height":{"custom":"300px"},"width":{"custom":"100%"},"legendsPadding":{"b":"pb-lg"}},"chartColours":{"colourBy":"SERIES","colourMapping":{}},"yAxis":{"axisLine":{"enabled":true},"gridLines":{"enabled":true},"ticks":{"enabled":true}},"xAxis":{"axisLine":{"enabled":true},"gridLines":{"enabled":false},"ticks":{"enabled":true,"position":"outsideBar"}},"legends":{"position":"top"}},"slots":{}},"id":"b_MbrnG","visibility":{"value":true},"v":0,"dpOn":[],"dP":[{"p":"content.data"}],"parentId":"b_ngIkB","displayName":"chart5"}
```

## Drawer  ·  806 blocks
- **content**: variant, hideOnClickOutside, containerId, allowResize, pageId, dragDownToClose, inputs
- **appearance**: position, defaultWidth, styles, backdrop, defaultHeight, type, floatingOffset, heightMode, snapPoints
```json
{"component":{"componentType":"Drawer","content":{"variant":"page","hideOnClickOutside":true,"allowResize":true},"appearance":{"position":"right","backdrop":{"showBackdrop":true,"backdropStyles":{"backgroundColor":"var(--palette-alpha-white-05)","blurRadius":8}},"type":"fixed","defaultWidth":"w-full","styles":{}},"slots":{"body":{"blockId":"b_bh7Gp","wrappedInLayout":true}}},"displayName":"ChatMoreActionsDrawerMobile","id":"b_PVOr5","visibility":{"value":false},"v":0,"dpOn":[],"parentId":"root_id","dataSourceIds":[],"additional":{"customCSS":"/* [data-block-id='b_PVOr5'] {\n  height: auto !important;\n  max-height: 85vh;\n}\n\n[data-block-id='b_PVOr5'] .flex-1.overflow-y-auto {\n   flex: 0 0 auto;\n } */"}}
```

## Checkbox  ·  788 blocks
- **content**: label, indeterminate, defaultValue, checked, description, help, addOns, schema
- **appearance**: size, disabled, customStyles
```json
{"component":{"componentType":"Checkbox","appearance":{"size":"md","customStyles":{"ua-checkbox":{"layout":{"height":20,"width":20},"color":{"checked":"green","unchecked":"orange"},"icon":{"size":15}}}},"content":{"defaultValue":"false"}},"visibility":{"value":true},"dpOn":[],"v":0,"additional":{"customCSS":"{\n  \"ua-checkbox\":{\n    \"layout\":{\n      \"height\":20,\n      \"width\":20\n    },\n    \"color\":{\n      \"checked\":\"green\",\n      \"unchecked\":\"orange\"\n    },\n    \"icon\":{\n      \"size\":15\n    }\n  }\n}"},"dataSourceIds":[],"id":"b_Fnrj0","parentId":"b_LiDwQ","events":[],"displayName":"tcCheckbox"}
```

## Loader  ·  766 blocks
- **content**: —
- **appearance**: type, styles, size, contentStyle, customStyles
```json
{"component":{"componentType":"Loader","appearance":{"size":"xs","styles":{"margin":{"l":"-ms-4xl"},"width":{"custom":"24px"},"height":{"custom":"24px"}},"type":"DEFAULT"},"content":{}},"visibility":{"conditions":{"payload":{"filters":[{"filter":{"value":"true","operator":"EQUAL"},"property":"{{ e_689f66fc2eb6f79c84acae89['isLoading'] }}"},{"filter":{"value":"Verify Member","operator":"EQUAL"},"property":"{{ var_wnueZ['value'] }}"}],"operator":"AND"},"type":"filter"},"value":"conditions"},"dpOn":[{"id":"e_689f66fc2eb6f79c84acae89","p":["e_689f66fc2eb6f79c84acae89['isLoading']"]},{"id":"var_wnueZ","p":["var_wnueZ['value']"]}],"displayName":"loader5","v":0,"dataSourceIds":["e_689f66fc2eb6f79c84acae89"],"id":"b_XC2VW","parentId":"b_oDhWq","cP":[{"p":"visibility.conditions"}],"dP":[{"p":"visibility.conditions.payload.filters[0].property"},{"p":"visibility.conditions.payload.filters[1].property"}]}
```

## TextArea  ·  753 blocks
- **content**: addOns, placeholder, defaultValue, maxCharacters, value
- **appearance**: minRows, maxRows, width, size, variant, autofocus, disabled, autoselect, styles, readOnly
```json
{"component":{"componentType":"TextArea","content":{"placeholder":"Optional — required when the reason is OTHER","addOns":{"label":{"value":"Comments","appearance":{"variant":"text-sm","weight":"medium","color":"text-secondary"}}}},"appearance":{"size":"md","variant":"outlined","width":{"custom":"100%"},"minRows":2,"maxRows":5}},"id":"b_x3c0r","v":0,"visibility":{"value":true},"displayName":"amComments","dpOn":[],"dataSourceIds":[],"parentId":"b_MOBVX","events":[{"eventType":"onChange","id":"evt_hmQVw","action":{"actionType":"setPageVariable","payload":{"variableId":"var_fI8Ve","operationDetails":{"operation":"SET","value":"{{ b_x3c0r['value'] }}"}},"id":"act_bI0IG"}}]}
```

## Avatar  ·  678 blocks
- **content**: type, addOns, fallbackText, data, initialsType, imageSource, icon
- **appearance**: styles, avatar, color, size, customStyles
```json
{"id":"b_wFxob","parentId":"b_syTxS","displayName":"avatar10","dataSourceIds":[],"component":{"componentType":"Avatar","content":{"type":"image","fallbackText":"{{ b_eC0V5['context']['item']['$LOOKUP$e_6ab28b89eb94a260d50342ba$$SER$$bjects_$_ownerUserId']['name'] }}","initialsType":"single","addOns":{},"data":{"type":"URL"}},"appearance":{"avatar":{"size":"xxs","color":"bg-medium"},"styles":{"gap":{"all":"gap-md"},"width":"w-fit","margin":{"l":"ms-9xl"},"padding":{"l":"ps-lg"},"height":"h-fit"}}},"visibility":{"value":true},"v":0,"dpOn":[{"id":"b_eC0V5","p":["b_eC0V5['context']['item']['$LOOKUP$e_6ab28b89eb94a260d50342ba$$SER$$bjects_$_ownerUserId']['name']"]}],"additional":{"customCSS":"[data-block-id='b_wFxob'] {\n  height: 16px;\n  width: 16px;\n  font-size: 8px !important;\n}","isCustomCSSValid":true},"dP":[{"p":"content.fallbackText"}]}
```

## ProgressBar  ·  582 blocks
- **content**: type, progress, min, max, decimalPlaces, notation, label, addOns, labels
- **appearance**: color, size, trackColor, styles, value, label, hideLabel, labelPosition, showValueMarker, labelStyle, angle
```json
{"component":{"componentType":"ProgressBar","content":{"type":"Circle","min":0,"max":100,"progress":"100","decimalPlaces":0,"notation":"standard"},"appearance":{"color":"var(--palette-error-600)","trackColor":"var(--palette-gray-100)","size":{"0":"m","1":"d","value":"xs","isDirty":true},"labelStyle":{"hideLabel":true,"position":"bottom","color":"var(--palette-gray-900)","variant":"text-sm","weight":"semi-bold"},"value":{"variant":"display-sm","weight":"semi-bold","color":"text-primary"},"label":{"variant":"text-xs","weight":"medium","color":"text-tertiary"},"styles":{"width":{"custom":"16px"},"height":{"custom":"16px"}}},"slots":{}},"id":"b_MHon3","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_wyuUj","dataSourceIds":[],"additional":{"customCSS":"[data-block-id='b_MHon3'] .MuiCircularProgress-track,\n.MuiCircularProgress-progress {\n  stroke-width: 1.371px !important;\n} ","isCustomCSSValid":true},"displayName":"progress1"}
```

## StatCard  ·  541 blocks
- **content**: type, value, enableTrendColor, thresholdValue, invertTrend, notation, style, addOns, decimalPlaces, label, description, currencyCode, fallbackValue, transform, locale, padDecimalPlaces
- **appearance**: styles, label, value, description, size
```json
{"component":{"componentType":"StatCard","appearance":{"description":{"color":"text-quaternary","variant":"text-sm","weight":"regular"},"styles":{"padding":{"all":"p-lg"},"borderColor":"border-tertiary","backgroundColor":"bg-primary","visibility":"visible","backgroundImage":"","minWidth":"none","layout":"flex-shrink-0","overflow":{"all":"overflow-hidden"},"borderRadius":{"all":"rounded-none"},"borderWidth":{"all":"border"},"gap":{"all":"gap-sm"},"width":"w-full","backgroundSize":"bg-auto","backgroundRepeat":"bg-repeat","maxWidth":"none"},"label":{"truncate":true,"color":"text-tertiary","variant":"text-sm","weight":"medium"},"value":{"color":"text-primary","variant":"display-sm","weight":"semi-bold"}},"content":{"decimalPlaces":0,"notation":"standard","addOns":{},"enableTrendColor":false,"style":"decimal","thresholdValue":0,"label":"Education Loan","type":"CURRENCY","invertTrend":false,"currencyCode":"USD","value":"1500"}},"visibility":{"value":true},"dataSourceIds":[],"id":"b_vdNeG","parentId":"b_qGtE2","displayName":"statCard17","v":0,"dpOn":[]}
```

## KeyValue  ·  498 blocks
- **content**: fields, fieldsType, mappedFields, hideNilValueFields
- **appearance**: groupLayout, label, divider, showMoreButton, size, styles, decorators, columns
```json
{"component":{"componentType":"KeyValue","slots":{},"appearance":{"showMoreButton":{"color":"brand","size":"md","variant":"ghost","label":"Show More"},"size":"md","divider":{"enabled":false},"decorators":{"field":{"startDecorator":{"styles":{"margin":{"r":"me-md"}}}},"value":{"startDecorator":{"styles":{"margin":{"r":"me-xs"}}},"endDecorator":{"styles":{"margin":{"r":"me-xs"}}}}},"columns":2,"styles":{"layout":"none","padding":{"all":"p-0"},"margin":{"all":"m-0"},"borderColor":"border-tertiary","borderRadius":{"all":"rounded-3xl"},"visibility":"visible","borderWidth":{"all":"border-0"},"gap":{"all":"gap-xl"},"rotation":{"custom":"0deg"},"width":{"custom":"100%"},"minWidth":"none","maxWidth":"none"},"label":{"valueAlignment":"LEFT","widthRatio":"1_1","gap":"gap-xs","position":"LEFT"},"groupLayout":"GRID"},"content":{"fields":[{"appearance":{"description":{"color":"text-quaternary","variant":"text-xs","weight":"regular"},"label":{"color":"text-secondary","variant":"text-sm","weight":"regular"},"value":{"size":"md","color":"brand","variant":"text-sm","weight":"medium"}},"addOns":{},"id":"kvF_HTMdU","content":{"editable":{"value":false},"label":"Vehicle Condition","type":"TAGS","value":"{{ e_68ad668e525d71385fd44370['data']['properties']['preDeliveryInspection']['exteriorCondition'] }}"}},{"appearance":{"description":{"color":"text-quaternary","variant":"text-xs","weight":"regular"},"label":{"color":"text-secondary","variant":"text-sm","weight":"regular"},"value":{"color":"text-primary","variant":"text-sm","weight":"medium"}},"id":"kvF_zq79p","content":{"editable":{"value":false},"label":"Mileage Reading","type":"STRING","value":"{{ e_68ad668e525d71385fd44370['data']['properties']['preDeliveryInspection']['mileageReading'] }} miles"}}]}},"dpOn":[{"id":"e_68ad668e525d71385fd44370","p":["e_68ad668e525d71385fd44370['data']['properties']['preDeliveryInspection']['exteriorCondition']","e_68ad668e525d71385fd44370['data']['properties']['preDeliveryInspection']['mileageReading']"]}],"v":0,"dataSourceIds":["e_68ad668e525d71385fd44370"],"id":"b_uXYRW","dP":[{"p":"content.fields[0].content.value"},{"p":"content.fields[1].content.value"}],"parentId":"b_uO1Rj","displayName":"keyValue20"}
```

## ContextualDialog  ·  496 blocks
- **content**: variant, pageId, disableClickAway, dialogBlockId, containerId
- **appearance**: side, alignment, styles, offset
```json
{"id":"b_SQuKk","parentId":"root_id","displayName":"dotArtifactContextDialog","dataSourceIds":[],"component":{"componentType":"ContextualDialog","content":{"variant":"card","pageId":""},"appearance":{"side":"bottom","alignment":"end","styles":{"borderColor":"border-secondary","borderWidth":{"all":"border"},"borderRadius":{"all":"rounded-md"},"width":{"custom":"130px"}}},"slots":{"body":{"blockId":"b_vmD9t","wrappedInLayout":true}}},"v":1,"dpOn":[],"additional":{"customCSS":"[data-block-id='b_SQuKk'] {\n  box-shadow: 0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03);\n}\n\n[data-block-id='b_SQuKk'] > div {\n  /* border-radius: 12px; */\n  box-shadow:0 12px 24px -8px rgba(16, 24, 40, 0.16),\n  0 2px 6px rgba(16, 24, 40, 0.06);\n}\n","isCustomCSSValid":true}}
```

## RadioButton  ·  370 blocks
- **content**: defaultValue, label
- **appearance**: size, label, description, styles, disabled
```json
{"id":"b_Co0hU","component":{"componentType":"RadioButton","content":{"label":"Replace with Manual Value","defaultValue":""},"appearance":{"size":"md"},"slots":{}},"additional":{"customCSS":""},"events":[],"v":0,"parentId":"b_rcjma","dpOn":[],"dataSourceIds":[],"displayName":"radioButton2"}
```

## Pressable  ·  332 blocks
- **content**: blockIds
- **appearance**: styles, disableSound, rippleEffect, wrapContent, reverseOrder, interactions, justifyContent, alignItems, customStyles, direction, hitSlop, disabled
```json
{"component":{"componentType":"Pressable","appearance":{"wrapContent":false,"reverseOrder":false,"interactions":{"opacity":1,"scale":1,"androidOverride":{"enabled":false},"androidRipple":false,"hapticFeedback":"none"},"hitSlop":10,"disableSound":false,"rippleEffect":{"enabled":false},"styles":{"borderColor":"border-transparent","height":"h-full"}},"content":{"blockIds":["b_w162v"]}},"visibility":{"value":true},"dpOn":[],"v":0,"dataSourceIds":[],"id":"b_Nukkh","parentId":"b_aib2w","events":[{"eventType":"onPress","action":{"actionType":"controlBottomSheet","payload":{"bottomSheetId":"b_c12cE","operation":"show","method":"trigger"},"id":"act_NRMOI"},"id":"Evt_DIZkf"}],"additional":{},"displayName":"pressable6"}
```

## Link  ·  286 blocks
- **content**: label, type, openInNewTab, url
- **appearance**: variant, underline, styles, disabled, color, weight, startDecorator, endDecorator
```json
{"component":{"componentType":"Link","content":{"type":"inline","label":"Terms of Service","openInNewTab":{"value":false},"url":"{{ var_wCJ7c['value']['terms']['href'] }}"},"appearance":{"variant":"text-xs","weight":"regular","color":"neutral","underline":"hover","disabled":false,"styles":{"color":"text-brand-tertiary","hoverColor":"hover:text-brand-secondary","activeColor":"active:text-brand-secondary"}},"slots":{}},"id":"b_v12eJ","visibility":{"value":"conditions","conditions":{"type":"filter","payload":{"filters":[{"property":"{{ var_wCJ7c['value']['terms']['href'] }}","filter":{"operator":"MIN_LENGTH","value":"1"}}],"operator":"AND"}}},"v":0,"dpOn":[{"id":"var_wCJ7c","p":["var_wCJ7c['value']['terms']['href']"]}],"parentId":"b_KH4Zt","dataSourceIds":[],"additional":{"customCSS":"[data-block-id='b_v12eJ'] {\n  /* Add your custom styles here */\n  color: var(--text-quaternary) !important;\n}","isCustomCSSValid":true},"displayName":"termsLink","dP":[{"p":"content.url"},{"p":"visibility.conditions.payload.filters[0].property"}],"cP":[{"p":"visibility.conditions"}]}
```

## ButtonGroup  ·  284 blocks
- **content**: mode, options, type, initialSelectedItemId, text
- **appearance**: color, size, variant, styles, popup, startDecorator, endDecorator, customStyles
```json
{"component":{"componentType":"ButtonGroup","appearance":{"popup":{"styles":{"overflow":{"y":"overflow-y-auto"},"maxHeight":"max-h-[400px]"}},"color":"neutral","size":"md","variant":"solid","styles":{"width":"w-full"},"customStyles":{"background":"#EDEFF1","height":48,"activeButton":{"background":"#ffffff","color":"#E04A09","height":40},"inactiveButton":{"background":"transparent","color":"#1C1F2ACC","height":40}}},"content":{"mode":"manual","options":{"data":[{"id":"button1","label":"MPIN","__id":"item_uid_dZYgL"},{"id":"button2","label":"Password","__id":"item_uid_HPsSt"}]},"type":"toggle","initialSelectedItemId":"button1"}},"visibility":{"conditions":{"type":"filter","payload":{"filters":[{"filter":{"value":"true","operator":"EQUAL"},"property":"{{ localStorage['values']['showMPIN'] }}"}],"operator":"AND"}},"value":"conditions"},"dpOn":[{"id":"localStorage","p":["localStorage['values']['showMPIN']"]}],"displayName":"buttonGroup5","v":0,"additional":{"customCSS":"{\n  \"background\":\"#EDEFF1\",\n  \"height\": 48,\n  \"activeButton\":{\n    \"background\":\"#ffffff\",\n    \"color\":\"#E04A09\",\n     \"height\": 40\n  },\n  \"inactiveButton\":{\n    \"background\":\"transparent\",\n    \"color\":\"#1C1F2ACC\",\n     \"height\": 40\n  }\n}"},"dataSourceIds":[],"id":"b_lxuZf","parentId":"b_gcF6c","events":[{"eventType":"onClick","action":{"actionType":"setPageVariable","payload":{"variableId":"var_9jH1n","method":"trigger","operationDetails":{"operation":"SET","value":"mpin"}},"id":"act_BlgdE"},"targetId":"button1","id":"Evt_m2ifa"},{"eventType":"onClick","action":{"actionType":"setPageVariable","payload":{"variableId":"var_9jH1n","method":"trigger","operationDetails":{"operation":"SET","value":"password"}},"id":"act_dNMk7"},"targetId":"button2","id":"Evt_9MP3j"}],"cP":[{"p":"visibility.conditions"}],"dP":[{"p":"visibility.conditions.payload.filters[0].property"}]}
```

## Filters  ·  241 blocks
- **content**: primaryActions, dataSourceIds, persistFilters
- **appearance**: styles, disabled
```json
{"component":{"componentType":"Filters","content":{"primaryActions":[{"showOnlyVisibleFields":true,"id":"gfItem_kEBXE","label":"Filter","type":"data","valueSource":"mapped","allowedFilterFields":[]},{"showOnlyVisibleFields":true,"id":"gfItem_Ro7PV","label":"Sort","type":"sort"}],"dataSourceIds":[]}},"visibility":{"value":true},"dpOn":[],"v":0,"dataSourceIds":[],"id":"b_k4wcZ","parentId":"b_a4hFy","displayName":"filters1"}
```

## Tabs  ·  193 blocks
- **content**: items, defaultValue, tabType, mappedTab, defaultValueForMappedTab
- **appearance**: tabItemAppearance, activeTabItem, styles, inactiveTabItem, variant, orientation, customStyles, scrollable
```json
{"component":{"componentType":"Tabs","appearance":{"tabItemAppearance":{"variant":"text-sm","weight":"semi-bold","styles":{"layout":"flex-shrink-0"}},"styles":{"minHeight":"none","layout":"flex-grow","padding":{"all":"p-0"},"overflow":{"all":"overflow-visible"},"visibility":"visible","maxHeight":"none","gap":{"all":"gap-xl"},"width":"w-full","minWidth":"none","maxWidth":"none","height":"h-full"}},"content":{"defaultValue":"tab_1","tabType":"manual","items":[{"label":"Account 360","disabled":false,"error":false,"blockId":"b_Q2Cc6","visibility":{"value":false},"id":"tab_1","value":"tab_1"},{"label":"Tasks 360","blockId":"b_Ow5dM","id":"tab_YSbaL","value":"tab_YSbaL","visibility":{"value":false}},{"label":"Insight 360","disabled":false,"error":false,"blockId":"b_vmwCi","visibility":{"value":false},"id":"tab_2","value":"tab_2"},{"disabled":false,"error":false,"blockId":"b_94mJp","visibility":{"value":true},"id":"tab_3","value":"tab_3"},{"label":"Review 360","blockId":"b_elHNT","visibility":{"value":false},"id":"tab_3Hh79","value":"tab_3Hh79"}]}},"visibility":{"value":true},"dpOn":[],"dataSourceIds":[],"id":"b_EgCsG","parentId":"b_Qe77I","displayName":"tabs3","v":0}
```

## FileUpload  ·  161 blocks
- **content**: selectionVariant, supportedFileTypes, allowDownload, addOns, fileVisibility, label, allowPublicAccess, maxFileSize, maxFiles, accessOptions, contentMode, clickable
- **appearance**: uploadIcon, styles, disabled
```json
{"component":{"componentType":"FileUpload","appearance":{"uploadIcon":"LcFileUpload","styles":{"borderColor":"border-brand-primary","borderRadius":"rounded-xl"}},"content":{"label":"Drop supporting logs here","addOns":{"description":{"content":"DAQ DUMPS / PDF REPORTS"}},"selectionVariant":"multiple","supportedFileTypes":["application/*",".pdf",".csv",".json","text/*"],"fileVisibility":"RESTRICTED"}},"additional":{"customCSS":"[data-block-id='b_xaha2'] { border-radius: 12px; }"},"events":[{"id":"evt_file_uploaded","eventType":"onFileUpload","action":{"id":"act_file_upload_notify","actionType":"showNotification","payload":{"title":"File uploaded successfully","type":"success","position":"top-right"}}}],"id":"b_xaha2","parentId":"b_qbcDM","dpOn":[],"dataSourceIds":[],"displayName":"fileUpload1","v":0}
```

## Toggle  ·  155 blocks
- **content**: defaultValue, label, showToggleLabel, description, addOns
- **appearance**: size, color, disabled
```json
{"component":{"componentType":"Toggle","appearance":{"size":"md","color":"brand"},"content":{"addOns":{"label":{"color":"text-secondary","variant":"text-md","weight":"medium"}},"showToggleLabel":true,"label":"Mark as submitted"}},"additional":{"customCSS":"[data-block-id='b_hjKIh'] label{color:var(--text-secondary);font-family:'Manrope',sans-serif;}"},"events":[{"id":"evt_toggle_submit","eventType":"onChange","action":{"id":"act_toggle_submit","actionType":"setPageVariable","payload":{"variableId":"var_submitted","method":"setPageVariable","operationDetails":{"operation":"TOGGLE"}}}}],"id":"b_hjKIh","parentId":"b_lnKyC","dpOn":[],"dataSourceIds":[],"displayName":"toggle1","v":0,"visibility":{"value":false}}
```

## CopilotInput  ·  124 blocks
- **content**: placeholder, mode, enterKeyBehavior, actions, linkedBlockId, autoFocus, autocomplete
- **appearance**: styles, attachmentListAlignment, minNumberOfLines
```json
{"id":"b_mCduL","component":{"componentType":"CopilotInput","content":{"placeholder":"{{b_wfegA['aiAgent']['conversationPlaceholder'] || 'Ask anything...'}}","mode":"comfortable","enterKeyBehavior":"SEND_MESSAGE","actions":[{"id":"messageInputAct_LpI9F","label":"Add Attachments","alignment":"start","type":"STANDARD","action":"addAttachments","icon":"Plus","supportedFileTypes":["application/*","text/*","image/*","text/markdown",".tsv"],"multipleFiles":true},{"id":"messageInputAct_sWdxY","label":"Tools","icon":"Settings04","alignment":"start","type":"STANDARD","action":"addTools"},{"id":"messageInputAct_4OQtf","label":"Send message","icon":{"conditionalValueFilters":[{"propertyValue":"ArrowRight","conditions":{"type":"filter","payload":{"filters":[{"property":"{{ b_wfegA['appearance']['size'] }}","filter":{"operator":"EQUAL","value":"lg"}},{"filters":[{"property":"{{ b_wfegA['chatId'] }}","filter":{"operator":"MISSING"}},{"property":"{{ b_wfegA['chatId'] }}","filter":{"operator":"EQUAL","value":"new"}}],"operator":"OR"}],"operator":"AND"}}}],"defaultValue":"ArrowUp"},"variant":"icon","alignment":"end","type":"STANDARD","action":"sendMessage","addOns":{"dictation":{"content":{"speechTimeout":5000}},"voiceMode":{}}}],"linkedBlockId":"b_wfegA","autoFocus":true,"autocomplete":false},"appearance":{"attachmentListAlignment":"top","styles":{"width":"w-full"},"minNumberOfLines":"{{ (b_wfegA['appearance']['size'] === 'lg' && b_wfegA['isEmpty']) ? 2 : 1 }}"}},"displayName":"copilotInput8","events":[{"action":{"actionType":"controlBlockMethod","payload":{"blockId":"b_wfegA","methodPayload":{},"methodName":"stopResponseGeneration"},"runCondition":{"payload":{"filters":[{"filter":{"value":"true","operator":"EQUAL"},"property":"{{  Boolean(b_wfegA['isGeneratingResponse']) }}"}],"operator":"AND"},"type":"filter"},"id":"act_6Gmwh"},"id":"evt_3k0V7","eventType":"onClick","targetId":"messageInputAct_4OQtf","hidden":true},{"action":{"actionType":"controlBlockMethod","payload":{"blockId":"b_wfegA","methodPayload":{"message":"{{ b_mCduL['value'] }}","attachments":"{{ b_mCduL['attachments'] }}","modelId":"{{ b_mCduL['modelId'] }}","skillIds":"{{ b_mCduL['skillIds'] }}","webSearchEnabled":"{{ b_mCduL['webSearchEnabled'] }}","deepResearchEnabled":"{{ b_mCduL['deepResearchEnabled'] }}","documentVisionEnabled":"{{ b_mCduL['documentVisionEnabled'] }}","enableKnowledge":"{{ b_mCduL['enableKnowledge'] }}","createImageEnabled":"{{ b_mCduL['createImageEnabled'] }}","knowledgeAppSources":"{{ b_mCduL['knowledgeAppSources'] }}","companyKnowledgeAppSources":"{{ b_mCduL['companyKnowledgeAppS …(trimmed)
```

## Calendar  ·  119 blocks
- **content**: firstDay, valueType, defaultDate, defaultStartDate, defaultEndDate, addOns
- **appearance**: viewOnlyMode, styles, periodType
```json
{"component":{"componentType":"Calendar","content":{"defaultDate":"2026-04-30T19:25:23.065Z","firstDay":"Sunday","valueType":"dateOnly","defaultStartDate":"2026-04-30T19:25:23.065Z","defaultEndDate":"2026-05-06T19:25:23.065Z"},"appearance":{"viewOnlyMode":false,"periodType":"singleMonth","styles":{"borderWidth":{"all":"border"},"borderRadius":{"all":"rounded-5xl"},"borderColor":"border-secondary","width":"w-fit"}},"slots":{"header":{"blockId":"b_xrI47","wrappedInLayout":true}}},"id":"b_Ca9Hx","v":0,"dpOn":[],"parentId":"b_4bapJ","events":[{"eventType":"onChange","action":{"actionType":"controlBlockMethod","executionType":"delay","id":"act_wahcx","payload":{"blockId":"b_aBHMf","methodName":"setValue","methodPayload":{"value":"{{ new Date(b_Ca9Hx['selectedDate']).toLocaleDateString('en-GB') }}"}}},"id":"evt_FQU0g"},{"eventType":"onChange","action":{"actionType":"controlBlockMethod","executionType":"delay","id":"act_Y1xoo","payload":{"blockId":"b_Z2kAa","methodName":"toggleContextualDialog"}},"id":"evt_Asf2Z"}],"dataSourceIds":[],"displayName":"datePicker3"}
```

## Copilot  ·  117 blocks
- **content**: welcomeText, shouldPollInfinitely, maxPollDuration, variant, allowedSpaceRoleIds, aiAgentId, addOns, voiceModeParams, separateVoiceModeControls, initialChatId, showJumpToLatest, enableCycleThinkingWords, runtimeContext, separateVoiceMode, conversationType, notifyOnCanvasReady, drawerContainerId, showCitationPanel, messageHistoryRepeatableBlockId, enableProfileMessages, artifactId, isArtifactPreview, actions, defaultSpaceRoleId
- **appearance**: size, styles, messageVariant, thoughtsVariant, enableThoughtDetails, canvasVariant, inlineCitationsVariant, enableTableExpansion, typographyVariant, autoMaximizeCanvasOnOpen, isArtifactPreview, copilotInputVariant, customStyles
```json
{"component":{"componentType":"Copilot","content":{"variant":"AI_AGENT","welcomeText":"Welcome {{ userContext['name'] }},\nHow can I help you today?","showJumpToLatest":true,"enableCycleThinkingWords":true,"voiceModeParams":{"separateVoiceMode":true,"separateVoiceModeControls":false,"fetchInitialMessagesOnConnect":false,"enableVideo":false,"enableScreenshare":false},"shouldPollInfinitely":true,"allowedSpaceRoleIds":[],"maxPollDuration":1800000,"addOns":{"responseActions":{"actions":[{"id":"copy","type":"copy","enabled":true},{"id":"like","type":"like","enabled":true},{"id":"dislike","type":"dislike","enabled":true},{"id":"voiceOutput","type":"voiceOutput","enabled":true},{"id":"citations","type":"citations","enabled":true},{"id":"exportToDocs","type":"exportToDocs","enabled":false},{"id":"queryCostBreakdown","type":"queryCostBreakdown","enabled":false},{"id":"queryCost","type":"queryCost","enabled":false}]},"userMessageActions":{"actions":[{"id":"copy","type":"copy","enabled":true},{"id":"edit","type":"edit","enabled":true}]}},"aiAgentId":"workflow_agent_mini_agent"},"appearance":{"size":"lg","styles":{"height":"h-full","width":"w-full","backgroundColor":"bg-inherit","position":"relative"}},"slots":{"messageInputPanel":{"blockId":"b_cqLYz","wrappedInLayout":true},"followUpPrompts":{"blockId":"b_iC6i8","wrappedInLayout":true}}},"displayName":"copilot1","id":"b_9ztzh","events":[{"action":{"actionType":"navigate","payload":{"path":"{{ b_9ztzh['events']['onCitationClick']['referenceUrl'] }}","history":"push","preserveSearchParams":false,"target":"_blank"},"id":"act_45dtZ"},"id":"evt_jCfFV","eventType":"onCitationClick"},{"action":{"actionType":"emitPageEvent","payload":{"eventName":"onInsertMessage","eventType":"onInsertMessage","eventPayload":{"message":"{{ b_9ztzh['events']['onInsertMessage']['text'] }}"}},"id":"act_Fqjbp"},"id":"evt_DECkb","eventType":"onInsertMessage","hidden":true},{"action":{"actionType":"showNotification","payload":{"title":"Voice Mode Connection Error","description":"{{ b_9ztzh['events']['onVoiceModeConnectError']['errorMessage'] }}","type":"error"},"id":"act_rYXuR"},"id":"evt_pgHGw","eventType":"onVoiceModeConnectError"}],"v":1,"dpOn":[{"id":"userContext","p":["userContext['name']"]}],"dP":[{"p":"content.welcomeText"}],"parentId":"b_z5Qv3","dataSourceIds":[]}
```

## LottieAnimation  ·  105 blocks
- **content**: data
- **appearance**: animationType, speed, styles, autoPlay, customStyles
```json
{"component":{"componentType":"LottieAnimation","appearance":{"animationType":"loop","speed":1,"styles":{"width":{"custom":"300px"},"height":{"custom":"300px"},"layout":"flex-shrink-0"},"autoPlay":true},"content":{"data":{"src":"https://assets.unifyapps.com/user-uploads/Liva-Health+Insurance-lottie.json","type":"URL"}}},"visibility":{"value":true},"dpOn":[],"v":0,"displayName":"lottieAnimation1","dataSourceIds":[],"id":"b_lQjVI","parentId":"b_wurcN"}
```

## Alert  ·  90 blocks
- **content**: descriptionType, description, title
- **appearance**: variant, styles, startDecorator
```json
{"component":{"componentType":"Alert","appearance":{"startDecorator":"InfoCircle","variant":"error","styles":{"borderWidth":{"all":"border"},"width":"w-full"}},"content":{"description":"__{{ e_6a9da27f035a7a40f27693de['error']['message'] ?? pageInputs['errorMessage'] }}__","descriptionType":"MARKDOWN"}},"visibility":{"value":true},"dataSourceIds":["e_6a9da27f035a7a40f27693de"],"id":"b_G3F8f","parentId":"b_evoLK","v":0,"dpOn":[{"id":"e_6a9da27f035a7a40f27693de","p":["e_6a9da27f035a7a40f27693de['error']['message']"]},{"id":"pageInputs","p":["pageInputs['errorMessage']"]}],"dP":[{"p":"content.description"}],"displayName":"alert17"}
```

## Stepper  ·  81 blocks
- **content**: type, steps, defaultStepValue, data, stepMappings
- **appearance**: orientation, size, stepDetails, styles, showStepNumber
```json
{"component":{"componentType":"Stepper","appearance":{"orientation":"horizontal","size":"md","styles":{"rotation":{"custom":"0deg"},"width":{"custom":"95%"}},"stepDetails":{"orientation":"vertical","description":{"color":"text-success-primary","variant":"text-xs","weight":"regular"},"label":{"color":"text-secondary","variant":"text-sm","weight":"semi-bold"}}},"content":{"type":"STATIC","defaultStepValue":"step_KG3fi","steps":[{"icon":"CheckCircleBroken","description":"10/10 checks passed ","label":"Account Review","id":"step_UNhZR","value":"step_UNhZR"},{"icon":"CheckCircleBroken","description":"3 new opportunities found","id":"step_wjrSZ","label":"Eligible Opportunities","value":"step_wjrSZ"},{"icon":"Mail01","description":"Drafting...","id":"step_KG3fi","label":"Send Upsell Emails","value":"step_KG3fi"}]}},"visibility":{"value":true},"dpOn":[],"v":0,"dataSourceIds":[],"id":"b_GTNRa","parentId":"b_2zpo9","displayName":"stepper1"}
```

## RichText  ·  78 blocks
- **content**: minNumberOfLines, maxNumberOfLines, extensionConfigFeatures, placeholder, defaultValue
- **appearance**: styles, autofocus, toolbarVariant, variant, disabled
```json
{"component":{"componentType":"RichText","content":{"defaultValue":"<p>{{ e_69aaa78b8565352e21a326f0['data']['html'] }}</p>","placeholder":"Enter your text here","minNumberOfLines":3,"maxNumberOfLines":5,"extensionConfigFeatures":{"fontFamily":false,"fontSize":false,"bold":false,"italic":false,"strikethrough":false,"underline":false,"history":false,"color":false,"highlight":false,"image":false,"link":false,"bulletList":false,"numberedList":false,"table":false,"alignment":false}},"appearance":{"toolbarVariant":"standard","autofocus":false,"variant":"outlined","styles":{"padding":{"all":"p-lg"}}}},"displayName":"richText3","id":"b_eg0Ei","visibility":{"value":true},"v":0,"dpOn":[{"id":"e_69aaa78b8565352e21a326f0","p":["e_69aaa78b8565352e21a326f0['data']['html']"]}],"dP":[{"p":"content.defaultValue"}],"parentId":"b_ko9JS","dataSourceIds":["e_69aaa78b8565352e21a326f0"]}
```

## Timer  ·  77 blocks
- **content**: mode, endValue, format, interval, startValue, autostart
- **appearance**: color, variant, weight, styles, customStyles
```json
{"component":{"componentType":"Timer","appearance":{"color":{"custom":"#E04A09FF"},"variant":"text-sm","weight":"medium"},"content":{"mode":"countdown","endValue":0,"format":"mm:ss","interval":1000,"startValue":60000,"autostart":true}},"visibility":{"conditions":{"type":"filter","payload":{"filters":[{"property":"{{ var_4Vs3q['value'] }}","filter":{"operator":"EQUAL","value":"false"}},{"property":"{{ var_hWJBx['value'] }}","filter":{"operator":"LT","value":"3"}}],"operator":"AND"}},"value":"conditions"},"dpOn":[{"id":"var_4Vs3q","p":["var_4Vs3q['value']"]},{"id":"var_hWJBx","p":["var_hWJBx['value']"]}],"v":0,"dataSourceIds":[],"id":"b_h0yO4","parentId":"b_nDN4S","events":[{"eventType":"onTimerExpire","action":{"actionType":"setPageVariable","payload":{"variableId":"var_4Vs3q","method":"trigger","operationDetails":{"operation":"TOGGLE"}},"id":"act_L2AeH"},"id":"Evt_cOr3a"}],"cP":[{"p":"visibility.conditions"}],"dP":[{"p":"visibility.conditions.payload.filters[0].property"},{"p":"visibility.conditions.payload.filters[1].property"}],"displayName":"timer1"}
```

## PDFViewer  ·  66 blocks
- **content**: data, addOns, fileUrl
- **appearance**: scalePageTo, styles, pageLayout
```json
{"component":{"componentType":"PDFViewer","content":{"data":{"type":"URL","src":"{{ pageInputs['url'] }}"}},"appearance":{"scalePageTo":"WIDTH","styles":{"width":"w-full","height":"h-full"}},"slots":{"toolbar":{"blockId":"b_YPkEY","wrappedInLayout":true}}},"displayName":"pdf1","id":"b_EpzKN","v":0,"dpOn":[{"id":"pageInputs","p":["pageInputs['url']"]}],"parentId":"b_UX7H6","dataSourceIds":[],"dP":[{"p":"content.data.src"}]}
```

## Timeline  ·  64 blocks
- **content**: data, title, addOns, containerId, dateTimeFormat, type, user, timeStamp, description, dateFormat, timeFormat, grouping
- **appearance**: styles, connectorColor
```json
{"id":"b_Wcz2d","component":{"componentType":"Timeline","content":{"data":"{{\n[\n{\n\"title\": \"Department Manager\",\n\"userName\": \"Sarah Al-Harthy\",\n\"description\": \"March 8, 2026 at 2:15 PM\",\n\"actionType\": \"Approved\",\n\"status\": \"completed\"\n},\n{\n\"title\": \"Finance Manager\",\n\"userName\": \"Ahmed Al-Balushi\",\n\"description\": \"March 8, 2026 at 2:15 PM\",\n\"actionType\": \"Approved\",\n\"status\": \"completed\"\n},\n{\n\"title\": \"You\",\n\"userName\": \"You\",\n\"description\": \"Pending approval\",\n\"actionType\": \"Pending\",\n\"status\": \"pending\",\n\"note\": \"Previous approver requested document verification before final approval\"\n},\n{\n\"title\": \"CEO\",\n\"userName\": \"Mohammad Al-Habsi\",\n\"description\": \"Awaiting approval\",\n\"actionType\": \"Waiting\",\n\"status\": \"waiting\"\n}\n]\n}}","type":"custom","containerId":"b_d3Nar","title":"{{ b_Wcz2d['context']['item']['title'] }}","timeStamp":"{{ b_Wcz2d['context']['item']['timeStamp'] }}","user":{"name":"{{ b_Wcz2d['context']['item']['userName'] }}"},"dateTimeFormat":"h:mm a","addOns":{"audit":{"data":"{{ b_Wcz2d['context']['item']['changes'] }}","title":"{{ b_Wcz2d['context']['item']['context']['auditItem']['title'] }}","operation":"{{ b_Wcz2d['context']['item']['context']['auditItem']['operation'] }}","newValue":"{{ b_Wcz2d['context']['item']['context']['auditItem']['newValue'] }}"},"grouping":{"groupBy":"day","dayFormat":"MMMM dd, yyyy"}}},"appearance":{"styles":{"minHeight":"min-h-[200px]","width":"w-full"}},"slots":{"timelineItem":{"blockId":"b_d5Jgk","wrappedInLayout":true},"timelineIcon":{"blockId":"b_wWBTk","wrappedInLayout":true}}},"v":0,"dpOn":[],"dP":[{"p":"content.data"},{"p":"content.title"},{"p":"content.timeStamp"},{"p":"content.user.name"},{"p":"content.addOns.audit.data"},{"p":"content.addOns.audit.title"},{"p":"content.addOns.audit.operation"},{"p":"content.addOns.audit.newValue"}],"dataSourceIds":[],"displayName":"timeline1"}
```

## Menu  ·  63 blocks
- **content**: type, menuItems, initialSelectedMenuItemId, data, menuItem
- **appearance**: size, styles
```json
{"id":"b_cD2BA","parentId":"b_r8GHR","displayName":"menu2","dataSourceIds":[],"events":[{"id":"evt_IwGY7","eventType":"onClick","action":{"actionType":"setPageVariable","id":"act_mXgB8","executionType":"delay","payload":{"variableId":"var_rLQzQ","method":"trigger","operationDetails":{"operation":"SET","value":"{{ { \"id\": \"a-z\", \"label\": \"Name (A-Z)\" } }}"}}},"targetId":"a-z"},{"id":"evt_pMEjk","eventType":"onClick","action":{"actionType":"controlBlockMethod","id":"act_yHKbP","onSuccessActions":[{"actionType":"setPageVariable","id":"act_vwPoi","payload":{"variableId":"var_OQjvO","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ { \"field\": \"properties_artifactLcName\", \"order\": \"ASC\" } }}"}},"executionType":"delay"}],"executionType":"delay","payload":{"blockId":"b_AfR9B","methodName":"hideContextualDialog"}},"targetId":"a-z"},{"id":"evt_jEkdi","eventType":"onClick","action":{"actionType":"setPageVariable","id":"act_iFLJf","executionType":"delay","payload":{"variableId":"var_rLQzQ","method":"trigger","operationDetails":{"operation":"SET","value":"{{ { \"id\": \"recently-updated\", \"label\": \"Recently Updated\" } }}\n"}}},"targetId":"recently-updated"},{"id":"evt_YEJzN","eventType":"onClick","action":{"actionType":"controlBlockMethod","id":"act_5seDn","onSuccessActions":[{"actionType":"setPageVariable","id":"act_7MY86","payload":{"variableId":"var_OQjvO","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ { \"field\": \"mTm\", \"order\": \"DESC\" } }}"}},"executionType":"delay"}],"executionType":"delay","payload":{"blockId":"b_AfR9B","methodName":"hideContextualDialog"}},"targetId":"recently-updated"},{"id":"evt_bPSbV","eventType":"onClick","action":{"actionType":"setPageVariable","id":"act_IKZqM","executionType":"delay","payload":{"variableId":"var_rLQzQ","method":"trigger","operationDetails":{"operation":"SET","value":"{{ { \"id\": \"z-a\", \"label\": \"Name (Z-A)\" } }}"}}},"targetId":"z-a"},{"id":"evt_sHTqL","eventType":"onClick","action":{"actionType":"controlBlockMethod","id":"act_agO1Q","onSuccessActions":[{"id":"act_te0n2","actionType":"setPageVariable","payload":{"variableId":"var_OQjvO","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ { \"field\": \"properties_artifactLcName\", \"order\": \"DESC\" } }}"}},"executionType":"delay"}],"payload":{"blockId":"b_AfR9B","methodName":"hideContextualDialog"}},"targetId":"z-a"}],"component":{"componentType":"Menu","content":{"type":"STATIC","menuItems":[{"id":"recently-updated","type":"label","value":"recently-upda …(trimmed)
```

## BottomSheet  ·  58 blocks
- **content**: variant, dismissOnBackdropTap, dragDownToClose
- **appearance**: styles, backdrop, defaultHeight, height, handleBar, shape, behaviour, bottomSheetBackground, customStyles
```json
{"component":{"componentType":"BottomSheet","slots":{"body":{"blockId":"b_khSDX","wrappedInLayout":true}},"appearance":{"backdrop":{"showBackdrop":true},"defaultHeight":{"custom":"30%"},"styles":{}},"content":{"variant":"card"}},"visibility":{"value":true},"dpOn":[],"v":0,"dataSourceIds":[],"id":"b_c12cE","parentId":"root_id","displayName":"livasupportnew"}
```

## Slider  ·  53 blocks
- **content**: valueType, parameters, minimum, maximum, step, defaultValue, editable, label, description, helpText
- **appearance**: showNumberInput, showValueLabel, showMarkerLabels, styles
```json
{"id":"b_oK0Nr","component":{"componentType":"Slider","content":{"valueType":"single","parameters":{"type":"NUMBER"},"minimum":1,"maximum":10,"step":1,"defaultValue":"5","editable":{"value":false}},"appearance":{"showNumberInput":false,"showValueLabel":false,"showMarkerLabels":"off","styles":{}}},"additional":{"customCSS":""},"visibility":{"value":true},"events":[{"id":"evt_elem_slider_change","eventType":"onChange","action":{"id":"act_elem_set_score","actionType":"setPageVariable","payload":{"variableId":"var_elem_score","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ var_elem_score['value'] }}"}}}}],"v":0,"parentId":"b_YzSah","dpOn":[],"dataSourceIds":[],"displayName":"slider17"}
```

## Carousel  ·  52 blocks
- **content**: type, items, data, blockId, addOns, defaultSlideIndex, collectChildStates
- **appearance**: viewDetails, styles, autoPlay, enableNavigationButtons, enableLoop, playback, slidePeek, accessibility, customStyles
```json
{"component":{"componentType":"Carousel","content":{"type":"STATIC","items":[{"blockId":"b_Ksd8l","value":"slide_OKKRY","label":"Slide 1","id":"slide_OKKRY"},{"blockId":"b_yMAg9","value":"slide_80WI4","label":"Slide 2","id":"slide_80WI4"},{"label":"Slide 3","value":"slide_I88xj","id":"slide_I88xj","blockId":"b_B24vi"}]},"appearance":{"playback":{"enableLoop":false,"autoPlay":{"enabled":true,"duration":4000}},"slidePeek":{"variant":"standard"},"accessibility":{"enableNavigationButtons":false},"viewDetails":{"perView":1,"gap":0},"styles":{"gap":{"all":"gap-md "},"padding":{"custom":{"t":"pt-0","r":"pe-0","b":"30px","l":"ps-0"}},"width":"w-[540px]","margin":{"b":"mb-md"}}}},"displayName":"carousel11","id":"b_HII4r","v":0,"dpOn":[{"id":"b_WCebk","p":["b_WCebk['chatId']"]},{"id":"pageInputs","p":["pageInputs['initialChatId']"]},{"id":"var_tdlLg","p":["var_tdlLg['value']"]}],"parentId":"b_Pttcs","dataSourceIds":[],"additional":{"customCSS":"[data-block-id='b_HII4r'] .keen-slider__slide {\n  display: flex;\n  justify-content: center;\n  padding-top: 12px;\n}\n\n[data-block-id='b_HII4r'] .mx-px {\n  background-color: rgba(219, 214, 209, 0.5) !important;\n}\n\n[data-block-id='b_HII4r'] .mx-px>div {\n  background-color: #DBD6D1 !important;\n}","isCustomCSSValid":true},"visibility":{"value":"conditions","conditions":{"type":"filter","payload":{"filters":[{"filters":[{"property":"{{ b_WCebk['chatId']?? pageInputs['initialChatId'] }}","filter":{"operator":"MISSING"}},{"property":"{{ b_WCebk['chatId']?? pageInputs['initialChatId'] }}","filter":{"operator":"EQUAL","value":"new"}}],"operator":"OR"},{"property":"{{ var_tdlLg['value'] }}","filter":{"operator":"EQUAL","value":"visible"}}],"operator":"AND"}}},"cP":[{"p":"visibility.conditions"}],"dP":[{"p":"visibility.conditions.payload.filters[0].filters[0].property"},{"p":"visibility.conditions.payload.filters[0].filters[1].property"},{"p":"visibility.conditions.payload.filters[1].property"}]}
```

## Iframe  ·  48 blocks
- **content**: srcDoc, src, attributes, contentEditable
- **appearance**: styles
```json
{"component":{"componentType":"Iframe","content":{"src":"{{ e_6a7aff0e74988c75eeebefb6['data']['url'] }}"},"appearance":{"styles":{"width":"w-full","height":"h-full","borderRadius":{"all":"rounded-xs"}}}},"displayName":"webView1","id":"b_Netj4","visibility":{"value":"conditions","conditions":{"type":"filter","payload":{"filters":[{"property":"{{ e_6a7aff0e74988c75eeebefb6['isLoading'] }}","filter":{"operator":"EQUAL","value":"false"}}],"operator":"AND"}}},"v":0,"dpOn":[{"id":"e_6a7aff0e74988c75eeebefb6","p":["e_6a7aff0e74988c75eeebefb6['data']['url']","e_6a7aff0e74988c75eeebefb6['isLoading']"]}],"parentId":"root_id","dataSourceIds":["e_6a7aff0e74988c75eeebefb6"],"dP":[{"p":"content.src"},{"p":"visibility.conditions.payload.filters[0].property"}],"events":[{"eventType":"onMessageReceived","action":{"actionType":"showNotification","executionType":"delay","id":"act_TVfnh","payload":{"title":"{{ b_Netj4['events']['onMessageReceived']['message'] }}","type":"success"}},"id":"evt_NqBK8"}],"cP":[{"p":"visibility.conditions"}]}
```

## SteppedContainer  ·  48 blocks
- **content**: stepperId, items
- **appearance**: styles, theme
```json
{"component":{"componentType":"SteppedContainer","content":{"stepperId":"b_ruopq","items":[{"value":"stepItem_HUpvq","blockId":"b_tdY3i","label":"Policy Documents","stepValue":"step_1llT3"},{"value":"stepItem_b300O","blockId":"b_0TEO5","label":"Proposer & KYC","stepValue":"step_UNhZR"},{"value":"stepItem_6gjgE","blockId":"b_68Hjx","label":"Insured Member Details","stepValue":"step_wjrSZ"},{"value":"stepItem_9sbIQ","blockId":"b_k4s3A","label":"Medical & Underwriting","stepValue":"step_KG3fi"},{"value":"stepItem_FASXq","blockId":"b_KRXWy","label":"Checkout","stepValue":"step_Sc3td"}]},"appearance":{"theme":"inherit","styles":{"gap":{"all":"gap-lg"},"borderColor":"border-transparent","width":"w-full","height":"h-full"}}},"displayName":"steppedContainer1","id":"b_X25UI","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_FMV3f","dataSourceIds":[]}
```

## StepIndicator  ·  45 blocks
- **content**: source
- **appearance**: uncompletedDisplay, completedDisplay, pendingColor, styles, activeColor, completedColor, activeRingColor
```json
{"id":"b_DbGM1","displayName":"stepIndicator","component":{"componentType":"StepIndicator","content":{"source":"{{ b_RojlE['context']['currentStep'] }}"},"appearance":{"uncompletedDisplay":"number","completedDisplay":"check","activeColor":"bg-brand-solid","completedColor":"bg-brand-solid","pendingColor":"bg-tertiary","activeRingColor":"ring-brand","styles":{"width":{"custom":"28px"},"height":{"custom":"28px"},"borderRadius":{"all":"rounded-full"}}}},"parentId":"b_cjucr","additional":{"htmlAttributes":[{"key":"data-indicator","value":"true"},{"key":"data-step-index","value":"{{ b_RojlE['context']['currentStep']['index'] }}"},{"key":"data-step-status","value":"{{ b_RojlE['context']['currentStep']['status'] }}"},{"key":"data-substep","value":"{{ b_RojlE['context']['currentStep']['isSubStep'] }}"}]},"v":0,"dpOn":[{"id":"b_RojlE","p":["b_RojlE['context']['currentStep']","b_RojlE['context']['currentStep']['index']","b_RojlE['context']['currentStep']['status']","b_RojlE['context']['currentStep']['isSubStep']"]}],"dP":[{"p":"content.source"},{"p":"additional.htmlAttributes[1].value"},{"p":"additional.htmlAttributes[2].value"},{"p":"additional.htmlAttributes[3].value"}],"dataSourceIds":[],"visibility":{"value":true}}
```

## StepSeparator  ·  43 blocks
- **content**: source
- **appearance**: completedColor, pendingColor, styles
```json
{"id":"b_J8Oqr","displayName":"stepSeparator","component":{"componentType":"StepSeparator","content":{"source":"{{ b_qXiqK['context']['currentStep'] }}"},"appearance":{"completedColor":"border-utility-gray-500","pendingColor":"border-secondary","styles":{"borderWidth":{"all":"0.5px"},"borderStyle":"border-solid"}}},"parentId":"b_zpe9z","additional":{"htmlAttributes":[{"key":"data-separator","value":"true"},{"key":"data-orientation","value":"{{ b_qXiqK['appearance']['orientation'] }}"},{"key":"data-step-status","value":"{{ b_qXiqK['context']['currentStep']['status'] }}"},{"key":"data-substep","value":"{{ b_qXiqK['context']['currentStep']['isSubStep'] }}"}]},"v":0,"dpOn":[{"id":"b_qXiqK","p":["b_qXiqK['context']['currentStep']","b_qXiqK['appearance']['orientation']","b_qXiqK['context']['currentStep']['status']","b_qXiqK['context']['currentStep']['isSubStep']"]}],"dP":[{"p":"content.source"},{"p":"additional.htmlAttributes[1].value"},{"p":"additional.htmlAttributes[2].value"},{"p":"additional.htmlAttributes[3].value"}],"dataSourceIds":[]}
```

## StepperV2  ·  41 blocks
- **content**: type, steps, allowClickNavigation, defaultStepValue, data, stepMappings, stepIconMappings, subStepMappings
- **appearance**: orientation, styles
```json
{"component":{"componentType":"StepperV2","content":{"type":"DYNAMIC","steps":[{"label":"Personal Info","description":"Enter your basic details","value":"step1","id":"step1","icon":"User","__id":"item_uid_jrpVV"},{"label":"Address","description":"Home and billing address","value":"step2","id":"step2","icon":"MapPin","__id":"item_uid_oohvh"},{"label":"Payment","description":"Payment method and billing","value":"step3","id":"step3","icon":"CreditCard","subSteps":[{"label":"Card Details","description":"Enter card information","value":"step3_1","id":"step3_1","__id":"item_uid_rVbKr"},{"label":"Billing Address","description":"Confirm billing address","value":"step3_2","id":"step3_2","__id":"item_uid_9bDjz"}],"__id":"item_uid_FaucK"},{"label":"Review","description":"Verify and submit","value":"step4","id":"step4","icon":"CheckCircle","__id":"item_uid_fFtnR"}],"allowClickNavigation":false,"data":"{{ e_6a3e5329d920343178e8393c['data']['journey'] }}","stepMappings":{"description":{"path":"Summary","key":"Summary","originalPath":"Summary","originalKey":"Summary"},"label":{"path":"RefinedLabel","key":"RefinedLabel","originalPath":"RefinedLabel","originalKey":"RefinedLabel"},"value":{"path":"MilestoneId","key":"MilestoneId","originalPath":"MilestoneId","originalKey":"MilestoneId"}},"stepIconMappings":{"iconColor":{"path":"DotColor","key":"DotColor","originalPath":"DotColor","originalKey":"DotColor"}},"defaultStepValue":"{{ e_6a3e5329d920343178e8393c['data']['journey'].at(-2).MilestoneId }}"},"appearance":{"orientation":"horizontal","styles":{"width":"w-full","gap":{"all":"gap-sm"}}},"slots":{"stepTrack":{"blockId":"b_zpe9z","wrappedInLayout":true},"stepBody":{"blockId":"b_wAZa8","wrappedInLayout":true}}},"displayName":"stepper6","id":"b_qXiqK","v":0,"dpOn":[{"id":"e_6a3e5329d920343178e8393c","p":["e_6a3e5329d920343178e8393c['data']['journey']"]}],"dP":[{"p":"content.data"},{"p":"content.defaultStepValue"}],"parentId":"b_B2WjN","dataSourceIds":["e_6a3e5329d920343178e8393c"]}
```

## AudioPlayer  ·  33 blocks
- **content**: mode, addOns, markers, url
- **appearance**: styles, waveformColor, progressColor, mode
```json
{"id":"b_tOrO0","component":{"componentType":"AudioPlayer","content":{"url":"{{ var_BQwHe['value'] }}","mode":"manual","markers":{"data":[]},"addOns":{"panningWaveform":{"enabled":true}}},"appearance":{"mode":"minimal","waveformColor":"var(--palette-gray-300)","progressColor":{"custom":"#E6B98BFF"},"styles":{"height":{"custom":"30px"},"margin":{"all":"m-md"},"minWidth":{"custom":"220px"},"width":"w-full"}}},"displayName":"audioPlayer1","parentId":"b_mmXkh","v":0,"dpOn":[{"id":"var_BQwHe","p":["var_BQwHe['value']"]}],"dP":[{"p":"content.url"}],"dataSourceIds":[],"additional":{"customCSS":"[data-block-id='b_tOrO0'] span {\n  /* Add your custom styles here */\n  color: white;\n}\n\n[data-block-id='b_tOrO0'] button {\n  --button-bg: rgba(255, 255, 255, 0.7) !important;\n  --button-bg_hover: rgba(255, 255, 255, 0.6) !important;\n}\n\n[data-block-id='b_tOrO0'] button svg {\n  fill: black;\n  stroke: black;\n}\n\n[data-block-id='b_tOrO0'] button {\n  --IconButton-size: 32px !important;\n  /* default ~40-48 */\n  width: 32px !important;\n  height: 32px !important;\n  min-width: 32px !important;\n  min-height: 32px !important;\n  padding: 4px !important;\n}\n\n[data-block-id='b_tOrO0'] button svg {\n  width: 16px !important;\n  height: 16px !important;\n}"}}
```

## Rating  ·  31 blocks
- **content**: icon, maxRating, defaultValue, editable, label
- **appearance**: size, ratedColor, unratedColor, starGap, label, description, helpText, styles
```json
{"component":{"componentType":"Rating","content":{"icon":"StarBackground","maxRating":5,"defaultValue":2,"editable":{"value":true}},"appearance":{"size":"sm","ratedColor":"fill-palette-warning-300","unratedColor":"fill-[var(--palette-gray-100)]","starGap":"gap-sm","label":{"variant":"text-sm","weight":"medium","color":"text-primary"},"description":{"variant":"text-xxs","weight":"regular","color":"text-secondary"},"helpText":{"variant":"text-xxs","weight":"regular","color":"text-secondary"},"styles":{"padding":{"y":"py-sm"},"borderColor":"border-transparent"}}},"id":"b_JPMKi","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_n8KMb","dataSourceIds":[],"displayName":"rating5"}
```

## Dictation  ·  29 blocks
- **content**: dictationSettings
- **appearance**: —
```json
{"component":{"componentType":"Dictation","content":{"dictationSettings":{"sttProvider":"SYSTEM","serverUrl":"wss://ai-python-livekit-agent-global.ext-alb.uat.unifyapps.com/ws/dictation"}},"slots":{"body":{"blockId":"b_lA0lC","wrappedInLayout":true}}},"id":"b_lSozh","v":0,"dpOn":[],"parentId":"b_p4IJ3","displayName":"dictation3","events":[{"eventType":"onStartDictation","action":{"actionType":"setPageVariable","id":"act_OiEzB","payload":{"variableId":"var_y8W4c","method":"trigger","operationDetails":{"operation":"SET","value":"1"}}},"id":"evt_DyeCL"},{"eventType":"onLiveDictation","action":{"actionType":"controlBlockMethod","id":"act_3PC4B","payload":{"blockId":"b_JZR4u","methodName":"setValue","methodPayload":{"value":"{{ b_lSozh['value'] }}"}}},"id":"evt_RnJEa"}],"dataSourceIds":[]}
```

## Video  ·  23 blocks
- **content**: enableLoop, enableAutoplay, url, enableSimultaneousPlay, thumbnailUrl
- **appearance**: controlsSize, styles, showControls, customStyles
```json
{"component":{"componentType":"Video","appearance":{"controlsSize":"lg","styles":{"borderColor":"border-transparent","borderRadius":{"all":"rounded-3xl"},"rotation":{"custom":"0deg"},"width":"w-full","height":{"custom":"450px"}},"showControls":true},"content":{"enableLoop":false,"enableAutoplay":false,"url":"api/file/download/<enc>","enableSimultaneousPlay":false}},"visibility":{"value":true},"dpOn":[],"v":0,"dataSourceIds":[],"id":"b_DI2b9","parentId":"b_elHNT","displayName":"video1"}
```

## CopilotVideo  ·  16 blocks
- **content**: trackType, videoSource, copilotId, mode, selectedParticipantId, floatingConfig, enablePopOutMode, initialState
- **appearance**: styles, size
```json
{"component":{"componentType":"CopilotVideo","content":{"mode":"static","trackType":"video","videoSource":"agent","copilotId":"b_D0v5o","selectedParticipantId":"","floatingConfig":{"containerId":"root_id","anchorRegion":"chat-panel","placement":"TOP_LEFT","bottom":"20px","start":"20px","end":"20px","top":"20px"}},"appearance":{"size":"lg","styles":{"borderRadius":{"all":"16px"},"width":"w-full","borderWidth":{"all":"1px"},"borderStyle":{"all":"border-solid"},"borderColor":{"all":{"custom":"var(--border-white)"}},"height":"h-full"}},"slots":{"emptyState":{"blockId":"b_4sQWh","wrappedInLayout":true}}},"id":"b_TLviy","v":0,"dpOn":[{"id":"b_D0v5o","p":["b_D0v5o['voiceMode']['agentState']"]}],"parentId":"b_YfNVG","dataSourceIds":[],"visibility":{"value":"conditions","conditions":{"type":"filter","payload":{"filters":[{"property":"{{ b_D0v5o['voiceMode']['agentState'] }}","filter":{"operator":"EQUAL","value":"LISTENING"}},{"property":"{{ b_D0v5o['voiceMode']['agentState'] }}","filter":{"operator":"EQUAL","value":"SPEAKING"}},{"property":"{{ b_D0v5o['voiceMode']['agentState'] }}","filter":{"operator":"EQUAL","value":"THINKING"}}],"operator":"OR"}}},"cP":[{"p":"visibility.conditions"}],"dP":[{"p":"visibility.conditions.payload.filters[0].property"},{"p":"visibility.conditions.payload.filters[1].property"},{"p":"visibility.conditions.payload.filters[2].property"}],"displayName":"copilotVideo4"}
```

## MessageInput  ·  16 blocks
- **content**: mode, variant, placeholder, actions, enterKeyBehavior, autoFocus, isSubmitDisabled
- **appearance**: styles
```json
{"component":{"componentType":"MessageInput","content":{"mode":"default","variant":"richText","enterKeyBehavior":"START_NEWLINE","placeholder":"Ask anything…","autoFocus":false,"actions":[{"id":"messageInputAct_eLt62","label":"Submit Message","alignment":"end","type":"STANDARD","action":"sendMessage","icon":"SvgCornerDownLeft","variant":"icon","addOns":{"dictation":{}}},{"label":"Custom Action","icon":"Plus","id":"messageInputAct_VtYbs","type":"CUSTOM","alignment":"start"}]},"appearance":{"styles":{"width":"w-full","borderColor":"border-transparent"}}},"displayName":"messageInput1","id":"b_MFfqy","visibility":{"value":false},"v":0,"dpOn":[],"parentId":"b_X0ifq","dataSourceIds":[],"additional":{"customCSS":"[data-block-id='b_MFfqy'] {\n  border-radius: 20px;\n  border: 1px solid rgba(255, 255, 255, 0.30);\n  background: rgba(0, 0, 0, 0.18);\n  box-shadow: 0 0 19px 1px rgba(0, 0, 0, 0.04);\n}\n\n[data-block-id='b_MFfqy'] .richtext-editor-content,\n[data-block-id='b_MFfqy'] .bg-primary {\n  background: transparent !important;\n}\n\n[data-block-id='b_MFfqy'] .is-editor-empty::before,\n[data-block-id='b_MFfqy'] [data-placeholder]::before {\n  color: #FFF !important;\n  font-family: var(--font_family_children, Manrope) !important;\n  font-size: 16px !important;\n  font-style: normal !important;\n  font-weight: 400 !important;\n  line-height: 24px !important;\n}\n"},"events":[{"eventType":"onClick","action":{"actionType":"controlBlockMethod","id":"act_E30uo","payload":{"blockId":"b_Z64Ot","methodName":"showContextualDialog"}},"id":"evt_VMX3j","targetId":"messageInputAct_VtYbs"}]}
```

## AvatarGroup  ·  16 blocks
- **content**: type, avatarGroupItems, mappedAvatars
- **appearance**: size, maxVisibleAvatars, styles, customStyles, initialsType
```json
{"component":{"componentType":"AvatarGroup","content":{"type":"STATIC","avatarGroupItems":[{"label":"Avatar 1","fallbackText":"Alice","type":"icon","value":"avatar1"},{"label":"Avatar 2","fallbackText":"Bob","type":"icon","value":"avatar2"},{"label":"Avatar 3","fallbackText":"Charlie","type":"icon","value":"avatar3"},{"label":"Avatar 4","fallbackText":"David","type":"icon","value":"avatar4"},{"label":"Avatar 5","fallbackText":"John","type":"icon","value":"avatar5"}]},"appearance":{"size":"xs","maxVisibleAvatars":3,"styles":{"padding":{"l":"ps-md"},"width":"w-fit"}}},"displayName":"avatarGroup1","id":"b_LbiyX","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_DTEVN","dataSourceIds":[]}
```

## Comments  ·  14 blocks
- **content**: source, variant, enterKeyBehavior, commentActions, data, assetId, extensionConfigFeatures
- **appearance**: size, styles, autofocus, display
```json
{"component":{"componentType":"Comments","slots":{},"appearance":{"size":"md","display":"bottomToTop","styles":{"padding":{"x":"px-lg"},"borderColor":"border-tertiary","overflow":{"y":"overflow-y-auto"},"height":"h-full"},"autofocus":false},"content":{"source":"entity","data":"{{ entityDataSource$b_WO0wP$salesforce_fields.data.comments }}","assetId":"{{ pageInputs['chatId'] }}","variant":"richText","enterKeyBehavior":"SEND_MESSAGE","extensionConfigFeatures":{"fontFamily":false,"fontSize":false,"bold":true,"italic":true,"strikethrough":true,"underline":true,"history":false,"color":false,"highlight":false,"image":false,"link":true,"bulletList":true,"numberedList":true,"table":true,"alignment":false},"commentActions":{"addEmoji":{"component":"SmallIconButton","appearance":{"emojiPreviewPosition":"none","iconClassName":"text-icon-primary","pickerTheme":"light"},"icon":"FaceSmile","action":"emojiPicker","label":"Emoji Picker","id":"messageInputAct_LoqW5","alignment":"start","type":"STANDARD"},"toggleFormatting":{"component":"SmallIconButton","icon":"SvgTypeMd","action":"toggleFormatting","label":"Toggle Formatting","id":"messageInputAct_LoqW6","alignment":"start","type":"STANDARD"},"deleteComment":{"icon":"Trash01","id":"deleteComment","label":"Delete"},"replyComment":{"icon":"Reply","id":"replyComment","label":"Reply","actions":[]},"addAttachments":{"icon":"Plus","supportedFileTypes":["*"],"multipleFiles":true,"component":"SmallIconButton","appearance":{"color":"neutral","size":"sm","variant":"soft","iconClassName":"text-icon-primary"},"action":"addAttachments","label":"Attachments","id":"messageInputAct_LoqW4","alignment":"start","type":"STANDARD"}}}},"visibility":{"value":true},"dpOn":[{"id":"entityDataSource$b_WO0wP$salesforce_fields","p":["entityDataSource$b_WO0wP$salesforce_fields.data.comments"]},{"id":"pageInputs","p":["pageInputs['chatId']"]}],"v":0,"dataSourceIds":["entityDataSource$b_WO0wP$salesforce_fields"],"id":"b_WO0wP","dP":[{"p":"content.data"},{"p":"content.assetId"}],"parentId":"b_JLeeS","displayName":"comments1","additional":{"customCSS":"[data-block-id='b_WO0wP']>div:last-child>div {\n  border-radius: 9999px;\n  background-color: var(--bg-primary);\n}\n[data-block-id='b_WO0wP'] > div{\n  background-color: transparent;\n}\n\n[data-block-id='b_WO0wP'][data-mobile=\"true\"] [data-testid=\"virtuoso-item-list\"] > div > div > div {\n  padding-left: 0px !important;\n}\n\n","htmlAttributes":[{"key":"data-mobile","value":"false"}]}}
```

## Camera  ·  12 blocks
- **content**: facingMode, mirror
- **appearance**: styles
```json
{"component":{"componentType":"Camera","content":{"facingMode":"user","mirror":true},"appearance":{"styles":{"height":"h-full","width":"w-full"}}},"displayName":"camera1","id":"b_KNEp8","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"root_id","events":[{"eventType":"onPhotoCapture","action":{"actionType":"setPageVariable","id":"act_TnR31","payload":{"variableId":"var_KfOWa","method":"trigger","script":"// Initialize array safely\nlet arr = Array.isArray(camera_array) ? camera_array : [];\n\n// Get latest captured image URL\nlet url = camera1?.uploadedImage?.url;\n\n// If valid, update both\nif (url) {\n  arr.push(url);\n}\n\n// Return both values\nreturn {\n  camera_array: arr,\n  latest_url: url\n};","operationDetails":{"operation":"SET","value":"{{\n(() => {\n  // Use variable directly (no .value)\n  const existing = Array.isArray(camera_array) ? camera_array : [];\n\n  const url = camera1?.uploadedImage?.url;\n\n  if (!url) return existing;\n\n  return [...existing, url];\n})()\n}}"}}},"id":"evt_1LTo7"}],"dataSourceIds":[]}
```

## InteractiveRegionsMap  ·  11 blocks
- **content**: version, data, entityId, type
- **appearance**: —
```json
{"component":{"componentType":"InteractiveRegionsMap","content":{"data":"{{ var_2vYfR['value'] }}","entityId":"e_694e8b769aa98c061eeed981","type":"CUSTOM_BLOCK_TYPE","version":"-1"}},"displayName":"interactiveRegionsMap1","id":"b_lFsYG","visibility":{"value":false},"v":0,"dpOn":[{"id":"var_2vYfR","p":["var_2vYfR['value']"]}],"parentId":"b_S6EAN","dataSourceIds":[],"dP":[{"p":"content.data"}]}
```

## Media  ·  11 blocks
- **content**: type, src, mappings
- **appearance**: display, maxUpfrontItems, variant, size, cols, showCaption, styles
```json
{"component":{"componentType":"Media","content":{"type":"MAPPED","src":"{{{{ e_69c6d3eb3ab63011bcd6a66a['data']['objects'] }}}}","mappings":{"url":{"path":"properties.public_url","key":"public_url","originalPath":"properties.public_url","originalKey":"public_url"},"id":{"path":"id","key":"id","originalPath":"id","originalKey":"id"},"name":{"path":"properties.attachment.name","key":"name","originalPath":"properties.attachment.name","originalKey":"name"},"mimeType":{"path":"properties.attachment.mimeType","key":"mimeType","originalPath":"properties.attachment.mimeType","originalKey":"mimeType"},"caption":{"path":"properties.attachment.mimeType","key":"mimeType","originalPath":"properties.attachment.mimeType","originalKey":"mimeType"}}},"appearance":{"display":"grid","maxUpfrontItems":2,"variant":"compact","size":"lg","cols":2,"showCaption":false,"styles":{"borderColor":"border-transparent","width":"w-full"}}},"id":"b_VeS19","visibility":{"value":true},"v":0,"dpOn":[{"id":"e_69c6d3eb3ab63011bcd6a66a","p":["e_69c6d3eb3ab63011bcd6a66a['data']['objects']"]}],"parentId":"b_Qu4ww","dataSourceIds":["e_69c6d3eb3ab63011bcd6a66a"],"dP":[{"p":"content.src"}],"displayName":"media2"}
```

## NestedTable  ·  11 blocks
- **content**: data, columns, rowSelection, rowActions, identifier, addOns
- **appearance**: gridLineAxis, rowHeight, styles, gridLineColor, headerAppearance, wrapColumnHeader, rowActions, hideHeaders, cellAppearance
```json
{"component":{"componentType":"NestedTable","content":{"rowSelection":"NONE","rowActions":[],"data":"{{ [{id:'1', name:'John', role: 'Admin'}, {id:'2', name:'Doe', role: 'Viewer'}] }}","columns":[{"id":"_3tOj2","fieldKey":{"path":"id","key":"id"},"label":"ID","type":"TEXT","width":60},{"id":"_OXrQv","fieldKey":{"path":"name","key":"name"},"type":"TEXT","label":"Name"},{"id":"_NQyHT","label":"Role","type":"TEXT","fieldKey":{"path":"role","key":"role"}},{"id":"_lz5Ji","type":"NESTED_TABLE","label":"Nested Table","hasChildren":{"path":"id","key":"id"},"data":"{{[{id:'1', name:'John', role: 'Admin'}, {id:'2', name:'Doe', role: 'Viewer'}]}}","identifier":{"path":"id","key":"id"},"columns":[{"id":"_GTAg1","fieldKey":{"path":"id","key":"id"},"label":"ID","type":"TEXT","width":60},{"id":"_Rttsc","fieldKey":{"path":"name","key":"name"},"type":"TEXT","label":"Name"},{"id":"_F11F9","label":"Role","type":"TEXT","fieldKey":{"path":"role","key":"role"}}]}],"identifier":{"path":"id","key":"id"}},"appearance":{"styles":{"gap":{"all":"gap-md"}},"rowHeight":"comfortable","gridLineAxis":"both"}},"displayName":"nestedTable1","id":"b_MPOIK","visibility":{"value":true},"v":0,"dpOn":[],"dP":[{"p":"content.data"},{"p":"content.columns[3].data"}],"parentId":"root_id"}
```

## CopilotVoice  ·  9 blocks
- **content**: variant, shouldPollInfinitely, maxPollDuration, copilotVoiceDetails, aiAgentId, enableVideo, fetchInitialMessagesOnConnect, enableScreenshare, useCustomRoomConfig, customRoomConfig, customRoomConnectionUrl, customRoomConnectionToken, customRoomId
- **appearance**: size, styles, thoughtsVariant, enableThoughtDetails
```json
{"component":{"componentType":"CopilotVoice","content":{"variant":"AI_AGENT","shouldPollInfinitely":true,"fetchInitialMessagesOnConnect":false,"enableVideo":true,"enableScreenshare":true,"maxPollDuration":1800000,"copilotVoiceDetails":{"isHeadless":true},"useCustomRoomConfig":false,"aiAgentId":"e_696a28221dbfa51d446d077a"},"appearance":{"size":"lg","styles":{"height":"h-full","width":"w-full","backgroundColor":"bg-inherit","position":"relative"}},"slots":{"body":{"blockId":"b_Ot3Va","wrappedInLayout":true},"controlActions":{"blockId":"b_BWMHv","wrappedInLayout":true}}},"displayName":"copilotVoice1","id":"b_9cdPN","events":[{"action":{"actionType":"showNotification","payload":{"title":"Voice Mode Connection Error","description":"{{ b_9cdPN['events']['onVoiceModeConnectError']['errorMessage'] }}","type":"error"},"id":"act_3vjxF"},"id":"evt_FMs1b","eventType":"onVoiceModeConnectError"},{"action":{"actionType":"showNotification","payload":{"title":"Voice Mode Screenshare Error","description":"{{ b_9cdPN['events']['onVoiceModeScreenshareFailed']['reason'] }}","type":"error"},"id":"act_6M4gM"},"id":"evt_zLyMV","eventType":"onVoiceModeScreenshareFailed"}],"v":0,"dpOn":[],"parentId":"root_id","dataSourceIds":[]}
```

## Navigation  ·  8 blocks
- **content**: navItems, defaultValue
- **appearance**: orientation, styles
```json
{"component":{"componentType":"Navigation","content":{"navItems":[{"title":"1.      Executive Summary","variant":"custom","id":"home","type":"label"},{"id":"notifications","title":"2. Business Model","variant":"custom","type":"label"},{"id":"settings","title":"3. Leadership","variant":"custom","type":"label"},{"id":"navMenuItem_vDWtH","title":"4. Purpose of Facility","variant":"custom","type":"label"},{"id":"navMenuItem_dOaWx","title":"5. Repayment Capacity","variant":"custom","type":"label"},{"id":"navMenuItem_8LvF0","title":"6. Stakeholders","variant":"custom","type":"label"},{"id":"navMenuItem_WWXzk","title":"7. Financial Performance","variant":"custom","type":"label"},{"id":"analytics","title":"8. Convenant Analysis","variant":"custom","type":"label"},{"id":"navMenuItem_TqpzU","title":"9. Banking Profile","variant":"custom","type":"label"},{"id":"navMenuItem_14Nkw","title":"10.  Security Structure","variant":"custom","type":"label"},{"title":"11. Risk Assessment","variant":"custom","id":"team","type":"label"}],"defaultValue":"home"},"appearance":{"orientation":"vertical","styles":{"gap":{"y":"gap-y-xxs"},"width":{"custom":"260px"},"borderWidth":{"r":"border-e"},"borderColor":"border-secondary","overflow":{"all":"overflow-auto"},"boxShadow":{"all":"shadow-none"}}}},"displayName":"navigation1","id":"b_TxURx","visibility":{"value":false},"v":0,"dpOn":[],"parentId":"root_id","dataSourceIds":[],"additional":{"customCSS":"[data-block-id='b_TxURx'] [data-nav-selected=\"true\"] {\n  background-color: #FFD6BF !important;\n}\n\n[data-block-id='b_TxURx'] [data-nav-selected=\"true\"] p {\n  color: #101828 !important;\n}"}}
```

## Scrollable  ·  8 blocks
- **content**: blockIds, snapping
- **appearance**: direction, wrapContent, reverseOrder, theme, alignItems, justifyContent, styles, customStyles
```json
{"component":{"componentType":"Scrollable","appearance":{"alignItems":"stretch","reverseOrder":false,"styles":{"padding":{"x":"px-2xl"},"borderColor":"border-transparent","gap":{"all":"gap-md"},"rotation":{"custom":"0deg"},"width":"w-full"},"theme":"inherit","wrapContent":false,"justifyContent":"flex-start","direction":"column"},"content":{"blockIds":["b_BNO7E","b_Hvwh3","__PLACEHOLDER__"]}},"visibility":{"value":true},"dpOn":[],"displayName":"Scrollable_1","v":0,"dataSourceIds":[],"id":"b_gpU05","parentId":"b_nhU2m"}
```

## EventsTimeline  ·  8 blocks
- **content**: data, mappings, addOns
- **appearance**: defaultView, theme, styles, showNowIndicator
```json
{"component":{"componentType":"EventsTimeline","content":{"data":"{{ e_69d4d90d52d7ee2bad83867d['data']['allEvents'] }}","mappings":{"primaryKey":{"key":"id","path":"id","originalPath":"id","originalKey":"id"},"titleFieldKey":{"key":"title","path":"title","originalPath":"title","originalKey":"title"},"startDateFieldKey":{"key":"startDate","path":"startDate","originalPath":"startDate","originalKey":"startDate"},"endDateFieldKey":{"key":"endDate","path":"endDate","originalPath":"endDate","originalKey":"endDate"}},"addOns":{"topToolbar":{"actions":[{"id":"TITLE","label":"Title","alignment":"START"},{"id":"SWITCH_VIEW","label":"Switch view","alignment":"START"},{"id":"NAVIGATION_BUTTONS","label":"Navigation buttons","alignment":"START"}],"enabled":true},"tooltip":{"enabled":true}}},"appearance":{"showNowIndicator":true,"defaultView":"Year","theme":"inherit","styles":{"width":"w-[640px]","height":"h-full","borderColor":"border-transparent","rotation":{"custom":"0deg"}}},"slots":{"eventItem":{"blockId":"b_Ehqsk","wrappedInLayout":true},"tooltip":{"blockId":"b_92fMj","wrappedInLayout":true}}},"displayName":"eventsTimeline2","id":"b_wdTiX","events":[{"action":{"actionType":"controlDrawer","payload":{"drawerId":"b_Pn7gR","method":"trigger","operation":"hide"},"onSuccessActions":[{"actionType":"controlDrawer","payload":{"drawerId":"b_Pn7gR","method":"trigger","operation":"show"},"id":"act_UqXMw"}],"id":"act_I3NmD"},"id":"evt_JYbOT","eventType":"onSelectInterval"},{"action":{"actionType":"controlDrawer","payload":{"drawerId":"b_59vWk","method":"trigger","operation":"show"},"id":"act_m2AYV"},"id":"evt_kLfXo","eventType":"onSelectItem"}],"v":0,"dpOn":[{"id":"e_69d4d90d52d7ee2bad83867d","p":["e_69d4d90d52d7ee2bad83867d['data']['allEvents']"]}],"dP":[{"p":"content.data"}],"parentId":"b_d5A3e","dataSourceIds":["e_69d4d90d52d7ee2bad83867d"]}
```

## OrganizationChart  ·  7 blocks
- **content**: data, blockId, primaryKey, parentKey, initialFocusId
- **appearance**: edgeAppearance, theme, styles, orientation
```json
{"component":{"componentType":"OrganizationChart","content":{"data":"{{ [{\"name\":\"Alice Johnson\",\"role\":\"CEO\",\"userId\":\"u1\",\"managerId\":null,\"avatarUrl\":\"https://picsum.photos/200?random=1\"},{\"name\":\"Bob Smith\",\"role\":\"CTO\",\"userId\":\"u2\",\"managerId\":\"u1\",\"managerName\":\"Alice Johnson\",\"avatarUrl\":\"https://picsum.photos/200?random=2\"},{\"name\":\"Catherine Lee\",\"role\":\"CFO\",\"userId\":\"u3\",\"managerId\":\"u1\",\"managerName\":\"Alice Johnson\",\"avatarUrl\":\"https://picsum.photos/200?random=3\"},{\"name\":\"David Brown\",\"role\":\"Engineering Manager\",\"managerName\":\"Bob Smith\",\"userId\":\"u4\",\"managerId\":\"u2\",\"avatarUrl\":\"https://picsum.photos/200?random=4\"},{\"name\":\"Emma White\",\"role\":\"Finance Manager\",\"managerName\":\"Catherine Lee\",\"userId\":\"u5\",\"managerId\":\"u3\",\"avatarUrl\":\"https://picsum.photos/200?random=5\"},{\"name\":\"Frank Green\",\"role\":\"Software Engineer\",\"managerName\":\"David Brown\",\"userId\":\"u6\",\"managerId\":\"u4\",\"avatarUrl\":\"https://picsum.photos/200?random=6\"},{\"name\":\"Grace Miller\",\"role\":\"Software Engineer\",\"managerName\":\"David Brown\",\"userId\":\"u7\",\"managerId\":\"u4\",\"avatarUrl\":\"https://picsum.photos/200?random=7\"},{\"name\":\"Henry Wilson\",\"role\":\"Accountant\",\"userId\":\"u8\",\"managerName\":\"Emma White\",\"managerId\":\"u5\",\"avatarUrl\":\"https://picsum.photos/200?random=8\"},{\"name\":\"Ivy Taylor\",\"role\":\"Marketing Manager\",\"managerName\":\"Alice Johnson\",\"userId\":\"u9\",\"managerId\":\"u1\",\"avatarUrl\":\"https://picsum.photos/200?random=9\"},{\"name\":\"Jack Moore\",\"role\":\"Marketing Specialist\",\"managerName\":\"Ivy Taylor\",\"userId\":\"u10\",\"managerId\":\"u9\",\"avatarUrl\":\"https://picsum.photos/200?random=10\"}] }}","blockId":"b_9HFOQ","primaryKey":{"key":"userId","path":"userId"},"parentKey":{"key":"managerId","path":"managerId"},"initialFocusId":"u7"},"appearance":{"orientation":"VERTICAL","edgeAppearance":{"default":{"color":"var(--palette-gray-200)","style":"solid"},"focused":{"color":"var(--palette-brand-600)","style":"solid"}},"theme":"inherit","styles":{"width":"w-full","height":"h-full","borderColor":"border-transparent"}},"slots":{}},"displayName":"organizationChart1","id":"b_dTqBR","v":0,"dpOn":[],"dP":[{"p":"content.data"}],"parentId":"b_GPv6O","dataSourceIds":[]}
```

## CopilotVoiceTranscripts  ·  7 blocks
- **content**: copilotId, variant, shouldPollInfinitely, maxPollDuration
- **appearance**: size, styles
```json
{"component":{"componentType":"CopilotVoiceTranscripts","content":{"copilotId":"b_laYTB","variant":"AI_AGENT","shouldPollInfinitely":true,"maxPollDuration":1800000},"appearance":{"size":"lg","styles":{"height":"h-full","width":{"custom":"50%"},"backgroundColor":"bg-inherit","position":"relative","borderColor":"border-transparent"}}},"displayName":"copilotVoiceTranscripts3","id":"b_y740i","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_gM4VC","dataSourceIds":[]}
```

## EventsCalendar  ·  6 blocks
- **content**: mode, defaultDate, defaultView, events, blockId, entities
- **appearance**: styles
```json
{"component":{"componentType":"EventsCalendar","appearance":{"styles":{"height":{"custom":"500px"}}},"content":{"mode":"entity","defaultDate":"2025-04-01","defaultView":"dayGridMonth","entities":["e_calendar_event"],"blockId":"b_HW0xq","events":{"data":"{{ entityDataSource$b_ZXzrv$e_calendar_event.data.events }}"}}},"dpOn":[{"id":"entityDataSource$b_ZXzrv$e_calendar_event","p":["entityDataSource$b_ZXzrv$e_calendar_event.data.events"]}],"v":0,"dataSourceIds":["entityDataSource$b_ZXzrv$e_calendar_event"],"id":"b_ZXzrv","dP":[{"p":"content.events.data"}],"events":[{"action":{"actionType":"controlDrawer","payload":{"drawerId":"b_yHGYS","method":"trigger","operation":"hide"},"onSuccessActions":[{"actionType":"controlDrawer","payload":{"drawerId":"b_yHGYS","method":"trigger","operation":"show"},"id":"act_e7ntA"}],"id":"act_HHM9d"},"id":"evt_SJSPu","eventType":"onSelectInterval"},{"action":{"actionType":"controlDrawer","payload":{"drawerId":"b_x5QQ3","method":"trigger","operation":"show"},"id":"act_d83Hu"},"id":"evt_CdB7W","eventType":"onSelectItem"}],"parentId":"b_ZSypl","displayName":"eventsCalendar2"}
```

## PinInput  ·  6 blocks
- **content**: length, variant, masked, maskingCharacter
- **appearance**: justifyContent, fontSize, color, styles
```json
{"component":{"componentType":"PinInput","content":{"length":6,"variant":"box","masked":false,"maskingCharacter":"-"},"appearance":{"justifyContent":"justify-center","fontSize":"display-xs","color":"text-utility-blue-dark-950","styles":{"gap":"gap-md","width":{"custom":"52px"},"height":{"custom":"52px"}}}},"id":"b_SKtCP","visibility":{"value":"conditions"},"v":0,"dpOn":[],"parentId":"b_wjkvN","dataSourceIds":[],"displayName":"pinInput1","events":[{"eventType":"onChange","action":{"actionType":"controlDataSource","id":"act_rAcyu","payload":{"dataSourceId":"e_6a759ffa61933d5c0b8335ee","method":"trigger"},"runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ b_SKtCP['value']['length'] }}","filter":{"operator":"EQUAL","value":"6"}}],"operator":"AND"}}},"id":"evt_xKlkc"}]}
```

## tryComp  ·  6 blocks
- **content**: data, entityId, type, version
- **appearance**: —
```json
{"component":{"componentType":"tryComp","content":{"version":"-1","data":"{{ { theme: \"dark\",markers: [\n      { id: \"doh\", name: \"DOH\", value: 562, coordinates: [54.446062, 24.423418] },\n      { id: \"scad\", name: \"SCAD\", value: 210, coordinates: [54.472578, 24.425589] },\n      { id: \"dct\", name: \"DCT\", value: 180, coordinates: [54.601760, 24.461979] },\n      { id: \"maan\", name: \"MAAN\", value: 95, coordinates: [54.464241, 24.430017] },\n      { id: \"fca\", name: \"FCA\", value: 300, coordinates: [54.464389, 24.430151] },\n      { id: \"dcd\", name: \"DCD\", value: 64, coordinates: [54.464567, 24.430143] },\n      { id: \"adha\", name: \"ADHA\", value: 120, coordinates: [54.464292, 24.431271] },\n      { id: \"ead\", name: \"EAD\", value: 145, coordinates: [54.388454, 24.463770] },\n      { id: \"rabdan\", name: \"Rabdan\", value: 80, coordinates: [54.436779, 24.430300] },\n      { id: \"adcda\", name: \"ADCDA\", value: 230, coordinates: [54.578573, 24.401293] },\n      { id: \"fdf\", name: \"FDF\", value: 110, coordinates: [54.357334, 24.459753] },\n      { id: \"doe\", name: \"DOE\", value: 175, coordinates: [54.618038, 24.428306] },\n      { id: \"dmt\", name: \"DMT\", value: 260, coordinates: [54.387352, 24.463971] },\n      { id: \"adek\", name: \"ADEK\", value: 320, coordinates: [54.491509, 24.413441] },\n      { id: \"qcc\", name: \"QCC\", value: 243, coordinates: [54.618676, 24.434339] },\n      { id: \"ded\", name: \"DED\", value: 298, coordinates: [54.376032, 24.486096] },\n      { id: \"adio\", name: \"ADIO\", value: 48, coordinates: [54.389620, 24.501674] },\n      { id: \"adcci\", name: \"ADCCI\", value: 132, coordinates: [54.352783, 24.488893] }\n      ,\n      { id: \"adafsa\", name: \"Yash\", value: 200, coordinates: [54.530552, 24.375414] }\n    ] } }}","entityId":"e_6a5de0987f703d1490fda4d1","type":"CUSTOM_BLOCK_TYPE"}},"displayName":"dgeMap2","id":"b_2amUw","visibility":{"value":true},"v":0,"dpOn":[],"dP":[{"p":"content.data"}],"parentId":"b_znkDl","additional":{"customCSS":"[data-block-id='b_2amUw'] {\n    height: 100%;\n  }\n\n  [data-block-id='b_2amUw'] iframe {\n    height: 100% !important;\n  }\n","isCustomCSSValid":true},"dataSourceIds":[]}
```

## Scanner  ·  6 blocks
- **content**: defaultCamera, ignoreDuplicateCodes, timeBetweenScans, scanCodeType, pauseAfterScan
- **appearance**: scanRegion, styles
```json
{"component":{"componentType":"Scanner","content":{"defaultCamera":"user","ignoreDuplicateCodes":true,"pauseAfterScan":false,"timeBetweenScans":800,"scanCodeType":"QR_CODE"},"appearance":{"scanRegion":{"frame":{"color":"var(--palette-alpha-white-100)","cornerRadius":"rounded-5xl","gap":{"custom":"6px"}},"width":{"custom":"336px"},"height":{"custom":"336px"}},"styles":{"width":"w-full","height":"h-full","overflow":{"all":"overflow-hidden"}}}},"id":"b_w77tW","visibility":{"value":true},"v":0,"dpOn":[],"parentId":"b_R68p4","dataSourceIds":[],"displayName":"scanner1"}
```

## NavigationContainer  ·  6 blocks
- **content**: items, blockId, navigationMenuId
- **appearance**: orientation, styles, theme
```json
{"component":{"componentType":"NavigationContainer","content":{"items":[{"value":"navContainerItem_9PpwW","blockId":"b_687mY","label":"Personal Details","navigationItemId":"home"},{"value":"navContainerItem_OoTog","blockId":"b_eHfx2","label":"Contact Information","navigationItemId":"analytics"},{"value":"navContainerItem_uFVZ6","blockId":"b_H3qq2","label":"Financial Information","navigationItemId":"notifications"},{"value":"navContainerItem_FjH4W","blockId":"b_sesyi","label":"Address Information","navigationItemId":"team"},{"value":"navContainerItem_ozC6O","blockId":"b_QStK2","label":"Application Information","navigationItemId":"settings"},{"value":"navContainerItem_Xsvyj","blockId":"b_ds8Hi","label":"Authentication Information","navigationItemId":"navMenuItem_81tuj"}],"blockId":"b_YlnXk","navigationMenuId":"b_YlnXk"},"appearance":{"orientation":"horizontal","theme":"inherit","styles":{"height":"h-full","gap":{"all":"gap-md"},"borderColor":"border-transparent"}}},"id":"b_RtiZB","v":0,"dpOn":[],"parentId":"b_zzd5B","dataSourceIds":[],"displayName":"NavigationContainer_1"}
```

## CodeEditor  ·  5 blocks
- **content**: lineNumber, editable, language, payload
- **appearance**: styles, theme
```json
{"component":{"componentType":"CodeEditor","content":{"lineNumber":true,"editable":true,"language":"json","payload":"{{ e_6aac10622f596041c32bfeb4['data'] }}"},"appearance":{"theme":"inherit","styles":{"height":"h-[640px]"}}},"displayName":"codeEditor1","id":"b_9IQ7Q","visibility":{"value":false},"v":0,"dpOn":[{"id":"e_6aac10622f596041c32bfeb4","p":["e_6aac10622f596041c32bfeb4['data']"]}],"parentId":"root_id","dP":[{"p":"content.payload"}],"dataSourceIds":["e_6aac10622f596041c32bfeb4"]}
```

## StackedTile  ·  5 blocks
- **content**: data, entityId, type, version
- **appearance**: —
```json
{"component":{"componentType":"StackedTile","content":{"version":"-1","data":"{{ {\n  \"theme\": var_Pbj98,\n  \"layers\": [\n    { \"id\": \"l0\", \"level\": 0, \"code\": \"L0\", \"name\": \"IDEATION\", \"count\": 73, \"unit\": \"USE CASES\" },\n    { \"id\": \"l1\", \"level\": 1, \"code\": \"L1\", \"name\": \"DEFINITION\", \"count\": 95, \"unit\": \"USE CASES\" },\n    { \"id\": \"l2\", \"level\": 2, \"code\": \"L2\", \"name\": \"QUALIFICATION\", \"count\": 123, \"unit\": \"USE CASES\" },\n    { \"id\": \"l3\", \"level\": 3, \"code\": \"L3\", \"name\": \"IMPLEMENTATION\", \"count\": 58, \"unit\": \"USE CASES\" },\n    { \"id\": \"l4\", \"level\": 4, \"code\": \"L4\", \"name\": \"DEVELOPMENT\", \"count\": 93, \"unit\": \"USE CASES\" },\n    { \"id\": \"l5\", \"level\": 5, \"code\": \"L5\", \"name\": \"PRODUCTION\", \"count\": 112, \"unit\": \"USE CASES\" },\n    { \"id\": \"l6\", \"level\": 6, \"code\": \"L6\", \"name\": \"PRODUCTION\", \"count\": 112, \"unit\": \"USE CASES\" },\n    { \"id\": \"l7\", \"level\": 7, \"code\": \"L7\", \"name\": \"PRODUCTION\", \"count\": 112, \"unit\": \"USE CASES\" }\n  ]\n} }}","entityId":"e_6a60b6a5f62c9924bb724878","type":"CUSTOM_BLOCK_TYPE"}},"displayName":"stackedTile1","id":"b_JsnIA","visibility":{"value":true},"v":0,"dpOn":[],"dP":[{"p":"content.data"}],"parentId":"root_id","dataSourceIds":[],"events":[{"eventType":"onChange","action":{"actionType":"setPageVariable","executionType":"delay","id":"act_HR7Xs","payload":{"variableId":"var_rc6cv","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ activeId }}"}},"onSuccessActions":[{"id":"act_rkhZD","actionType":"controlBlockMethod","payload":{"blockId":"b_JsnIA","methodName":"updateState","methodPayload":"{{ b_JsnIA['state'] }}"},"executionType":"delay"}]},"id":"evt_mnN2B"}]}
```
