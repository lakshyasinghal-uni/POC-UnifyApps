# Page-level structures — harvested

Examples of the page (`e_component.properties`) structures other than blocks.

## `pageVariables`

```json
{"name":"isLoadingConfig","type":"boolean","id":"var_Q1JKU","initialValue":"true"}
```
```json
{"name":"showError","id":"var_1v45w","type":"string"}
```

## `pageFunctions`

```json
{"func_h7uoJ":{"name":"updateLoginConfig","functionBody":"\nconst defaults = {\n      \"image\": {\n        \"url\": \"https://assets.unifyapps.com/images/platform/enterprise-search/es-login-1.png\"\n      },\n      \"description\": {\n        \"text\": \"Your Al brain across your organization, bringing answers, insights, and action to every task.\"\n      },\n      \"privacy\": {\n        \"href\": \"https://www.unifyapps.com\"\n      },\n      \"title\": {\n        \"text\": \"Enterprise Brain\"\n      },\n      \"loginAgent\": {\n        \"agentLogoUrl\": \"https://assets.unifyapps.com/images/platform/enterprise-search/unify-green-logo-m.svg\",\n        \"name\": \"Ask <i>Unify</i>\",\n        \"description\": \"Your AI Brain that gets work done\"\n      },\n      \"terms\": {\n        \"href\": \"https://www.unifyapps.com\"\n      }\n    };\n\nlet patch;\n\ntry {\n  patch = {{ e_6a9da58b166ab40430e31ad7?.['data']?.['properties']?.['pages']?.['login'] }};\n} catch (e) {\n  console.warn('global config unavailable, using defaults only', e);\n}\n\nconst isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);\n\nconst deepMerge = (base, p) => {\n  if (p === undefined || p === null) return base;\n  if (!isPlainObject(base) || !isPlainObject(p)) return p;\n  const out = { ...base };\n  for (const k of Object.keys(p)) out[k] = deepMerge(base[k], p[k]);\n  return out;\n};\n\nconst isLoading = {{ e_6a9da58b166ab40430e31ad7?.isLoading }}\n\n{{ var_wCJ7c.setValue(deepMerge(defaults, patch)) }};\n\n{{ var_Q1JKU.setValue(isLoading) }};","runBehaviour":"automatic","id":"func_h7uoJ","dataSourceIds":["e_6a9da58b166ab40430e31ad7"],"dpOn":[{"id":"e_6a9da58b166ab40430e31ad7","p":["e_6a9da58b166ab40430e31ad7['data']['properties']['pages']['login']","e_6a9da58b16 …(trimmed)
```
```json
{"func_1Ja8x":{"name":"updateESConfig","functionBody":"let userName = {{ userContext['name'] }} ;\ntry {\n  const alias = {{ e_6a68bdcd4c009a54b4739ad3?.['data']?.['alias'] }};\nif (alias) userName = alias;\n} catch (e) {\n  console.warn('fetchProfile unavailable, using generic greeting', e);\n}\n\nconst greetingTitle = userName ? `Hello <i>${userName}</i>` : 'Hello';\n\nconst agentAvatar = {{ localStorage['copilotAgentAvatar'] ?? {\n        \"idle\": {\n          \"type\": \"IMAGE\",\n          \"imageUrl\": \"https://assets.unifyapps.com/images/platform/ai/avatars/ai-dotted.svg?color=brand&background=var(--palette-brand-400)\"\n        },\n        \"thinking\": {\n            \"type\": \"LOTTIE\",\n            \"src\": \"https://assets.unifyapps.com/images/platform/enterprise-search/ai-dotted-animation.json\",\n          }\n      } }}\n\nconst defaults = {\n  \"app\": {\n    \"enableAgentCreation\": false,\n    \"enableChatCollaboration\": true\n  },\n  \"copilot\": {\n    \"shared\": {\n      \"agentAvatar\": agentAvatar\n    },\n    \"instances\": {\n      \"home\": {\n        \"greetingTitle\": {\n          \"default\": greetingTitle\n        },\n        \"greetingSubtitle\": {\n          \"default\": \"How can I help you today?\"\n        }\n      }\n    }\n  },\n  \"pages\": {\n    \"home\": {\n      \"enableOnboardingCarousel\": true\n    },\n    \"login\": {\n      \"image\": {\n        \"url\": \"http://assets.unifyapps.com/images/platform/enterprise-search/es-login.png\"\n      },\n      \"description\": {\n        \"text\": \"Ask Unify is your AI brain connecting knowledge, systems, and workflows to answer, automate, and get work done.\"\n      },\n      \"privacy\": {\n        \"href\": \"https://www.unifyapps.com\"\n      },\n      \"title\": {\n        \" …(trimmed)
```

## `events`

```json
[{"payload":{"type":"object","properties":{"Message":{"type":"string","title":"Message"}},"additionalProperties":false,"required":[]},"eventType":"p_evt_1pGSG","label":"message"}]
```
```json
[{"payload":{},"eventType":"pick","label":"Replacement SME picked"}]
```

## `inboundEvents`

```json
[{"eventType":"clearFilter","label":"Clear filter"}]
```
```json
[{"eventType":"refreshList","label":"Refresh list"}]
```

## `interactions`

```json
{"events":[{"action":{"actionType":"setPageVariable","id":"act_OjTDT","runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ pageInputs['1001_code_handling'] }}","filter":{"operator":"EQUAL","value":"email"}}],"operator":"AND"}},"payload":{"variableId":"var_GR2hD","method":"trigger","operationDetails":{"operation":"SET","value":"{{ pageInputs['MemberIdDecrypted'] }}"}},"onSuccessActions":[{"actionType":"setPageVariable","id":"act_N7GQu","payload":{"variableId":"var_SZu42","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ String(pageInputs['StaffId']) }}"}}},{"actionType":"setPageVariable","id":"act_uNOBG","payload":{"variableId":"var_2dnfA","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ pageInputs['DoB'] }}"}}},{"actionType":"setPageVariable","delayDuration":500,"id":"act_uRPOX","payload":{"variableId":"var_geaLJ","method":"setPageVariable","operationDetails":{"operation":"SET","value":"change_mobile_number"}}}]},"eventType":"onPageLoad","id":"evt_XFNmN"},{"action":{"actionType":"setPageVariable","id":"act_5lIY8","runCondition":{"type":"filter","payload":{"filters":[{"property":"{{ pageInputs['1001_code_handling'] }}","filter":{"operator":"EQUAL","value":"mobile"}},{"property":"{{ pageInputs['1001_code_handling'] }}","filter":{"operator":"EQUAL","value":"no"}}],"operator":"OR"}},"payload":{"variableId":"var_NtORl","method":"trigger","operationDetails":{"operation":"SET","value":"{{ pageInputs['MobileNoDecrypted'] }}"}},"onSuccessActions":[{"actionType":"setPageVariable","id":"act_L0S2O","payload":{"variableId":"var_GR2hD","method":"setPageVariable","operationDetails":{"operation":"SET","value":"{{ pageInputs['MemberIdDecrypted'] }}"}}},{"actionType":"setPageVariable","id":"act_UERe8","payload":{"var …(trimmed)
```
```json
{"events":[{"action":{"actionType":"setLocalStorage","id":"act_ethAF","delayDuration":2000,"payload":{"operation":"SET","key":"deviceid","value":"{{ userContext['context']['device']['deviceId'] }}","method":"trigger"},"executionType":"delay"},"eventType":"onPageLoad","id":"evt_ybwdi"}]}
```

## `inputSchema`

```json
{"schema":{"additionalProperties":false,"type":"object","properties":{"returnTo":{"type":"string","title":"Return To"},"errorMessage":{"type":"string","title":"Error Message"}},"required":[]},"layout":{"ui:order":["returnTo","errorMessage"]},"dynamic":false,"type":"SCHEMA_AND_LAYOUT"}
```
```json
{"schema":{"additionalProperties":false,"type":"object","properties":{"NoContextUser":{"type":"string","title":"No Context User"},"password_or_pin":{"type":"string","title":"Password or Pin"},"1001_code_handling":{"type":"string","title":"1001 Code Handling"},"MobileNoDecrypted":{"type":"string","title":"Mobile No Decrypted"},"EmailDecrypted":{"type":"string","title":"Email Decrypted"},"MemberIdDecrypted":{"type":"string","title":"Member Id Decrypted"},"StaffId":{"type":"string","title":"Staff Id"},"DoB":{"type":"string","title":"DoB"}},"required":[]},"layout":{"ui:order":["NoContextUser","password_or_pin","1001_code_handling","MobileNoDecrypted","EmailDecrypted","MemberIdDecrypted","StaffId","DoB"]},"dynamic":false,"type":"SCHEMA_AND_LAYOUT"}
```

## `devices`

```json
{"mobile":{}}
```
```json
{"mobile":{"diffs":{"blocks":{"b_34nwn":{"component":{"appearance":{"styles":{"padding":{"custom":{"l":["ps-4xl","16px"],"r":["pe-4xl","16px"]}}}}}},"b_Y2w8z":{"component":{"appearance":{"direction":["row","column"],"styles":{"gap":{"all":["gap-md","12px"]}}}}},"b_K5lku":{"component":{"appearance":{"direction":["row","column"],"styles":{"gap":{"all":["gap-md","12px"]}}}}},"b_y5r9B":{"component":{"appearance":{"direction":["row","column"],"alignItems":["center","stretch"],"styles":{"gap":{"all":["gap-md","12px"]}}}}},"b_rOfQ3":{"component":{"appearance":{"alignItems":["flex-end","stretch"]}}}}},"blocks":{"b_34nwn":{"component":{"componentType":"Stack","content":{"blockIds":["b_EKgNH","b_3wmGt","b_bjI1J","__PLACEHOLDER__"]},"appearance":{"direction":"column","alignItems":"stretch","justifyContent":"flex-start","reverseOrder":false,"styles":{"gap":{"all":"gap-md"},"backgroundColor":"bg-transparent","padding":{"custom":{"l":"16px","r":"16px"}},"width":"w-full","maxWidth":{"custom":"1200px"}},"wrapContent":false,"theme":"inherit"}},"id":"b_34nwn","v":0,"visibility":{"value":true},"displayName":"stack22","dpOn":[],"dataSourceIds":[],"parentId":"root_id"},"b_Y2w8z":{"component":{"componentType":"Stack","content":{"blockIds":["b_bzYCj","b_BUkQk","b_EGwey","b_9mlJT","__PLACEHOLDER__"]},"appearance":{"direction":"column","alignItems":"flex-start","justifyContent":"space-between","reverseOrder":false,"styles":{"gap":{"all":"12px"},"backgroundColor":"bg-transparent","padding":{"custom":{"t":"pt-2xl","b":"pb-2xl"}},"borderWidth":{"custom":{"b":"border-b"}},"borderColor":{"custom":{"b":"border-tertiary"}},"borderStyle":{"custom":{"b":"border-solid"}}},"wrapContent":false,"theme":"inherit"}},"id":"b_Y2w8z","v":0,"visibility":{"value":true},"parentId":"b_EDIgp","displayName":"stack6"," …(trimmed)
```

## `customBlocksVersionsMap`

```json
{"b_tQmHe":{"entityId":"e_694e8b769aa98c061eeed981","version":-1},"b_Hb7Ss":{"entityId":"e_694e8b769aa98c061eeed981","version":-1}}
```
```json
{"b_miQuO":{"entityId":"e_694c05a3634eff5fdaac705f","version":-1}}
```

## `embeddedEntityReferences`

```json
[{"entityType":"e_component","id":"e_6aa72381c5f3d070899e5dd7"},{"entityType":"e_component","id":"e_6aa7229958c18b2bb7409039"}]
```
```json
[{"entityType":"e_component","id":"e_6aa760afc5f3d07089a05096"},{"entityType":"e_interface","id":"gazelle"}]
```

## `walkthrough`

```json
{"settings":{"deviceDetails":"desktop","targetInterfacePageId":"e_6821d98eb946f97b1ddfebd1","onLoadDelay":0,"appearanceFrequency":"only_once","triggerType":"auto","priority":"medium","segmentType":"all_users","status":"active"},"steps":[{"tooltipPlacementBehavior":"auto","goToNextStepOnClickOf":"none","enableInteractionWithTargetElement":false,"tooltipStyles":{"width":"w-[360px]","maxHeight":"max-h-[400px]"},"targetType":"block","label":"step1","showAfterDelay":1000,"modalStyles":{"width":"w-[360px]","maxHeight":"max-h-[400px]"},"overlayColor":"bg-overlay","waitUntilElementAppears":false,"modalPlacement":"center","displayType":"modal","rootBlockId":"b_BL8RB","focusShape":"rectangle","showBackdrop":true,"enableInteractionWithPage":true,"id":"wts_01hk8","elementMissingBehavior":"skip","overlayOpacity":"opacity-75","interfacePageId":"e_6821d98eb946f97b1ddfebd1","showAfter":"delay"}]}
```
```json
{"settings":{"deviceDetails":"desktop","targetInterfacePageId":"e_699caf6b76644924d23c4cac","onLoadDelay":0,"appearanceFrequency":"only_once","triggerType":"auto","priority":"medium","segmentType":"all_users","status":"inactive"},"steps":[{"tooltipPlacementBehavior":"auto","goToNextStepOnClickOf":"none","enableInteractionWithTargetElement":false,"tooltipStyles":{"width":"w-[360px]","maxHeight":"max-h-[400px]"},"targetType":"block","label":"step1","showAfterDelay":0,"overlayColor":"bg-overlay","waitUntilElementAppears":false,"displayType":"tooltip","rootBlockId":"b_Ntn9B","focusShape":"rectangle","showBackdrop":true,"enableInteractionWithPage":false,"id":"wts_L7mb8","elementMissingBehavior":"skip","interfacePageId":"e_699caf6b76644924d23c4cac","overlayOpacity":"opacity-75","showAfter":"delay"}]}
```

## `customCode`

```json
{"header":"","footer":""}
```
```json
{"header":"","footer":""}
```

## `dependencies`

```json
{"documentTitle":{"dpOn":[]}}
```
```json
{"documentTitle":{"dpOn":[]}}
```
