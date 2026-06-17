# Changelog

## [2.0.0](https://github.com/plvo/shuip/compare/v1.3.0...v2.0.0) (2026-06-17)


### ⚠ BREAKING CHANGES

* **rhf-fields:** migrate to shadcn Field primitive, split InputField/NumberField ([#46](https://github.com/plvo/shuip/issues/46))
* **rhf-fields:** `<InputField>` no longer accepts a `register` prop. Install `@hookform/lenses`, call `useLens({ control: form.control })` once, and pass focused lenses: `<InputField lens={lens.focus('x')} />`.
* **tsf-fields:** All tsf-* field components and the submit button drop the `form`, `name`, and `formProps` props. Consumers must install `tsf-form-context`, call `createFormHook` once (typically in `lib/form.ts`), and switch from `<XField form={form} name='x' .../>` to `<form.AppField name='x' children={(f) => <f.XField .../>} />`.

### Features

* **autocomplete-field:** add rhf/tsf-autocomplete-field ([#54](https://github.com/plvo/shuip/issues/54)) ([e4bc459](https://github.com/plvo/shuip/commit/e4bc4599edacb63fb2986fd1028d5cc7f4140a25))
* **calendar:** generic responsive calendar block ([#66](https://github.com/plvo/shuip/issues/66)) ([e3841ae](https://github.com/plvo/shuip/commit/e3841ae1fd84eb8703b2b5772d82ab923d69c79b))
* **combobox-field:** searchable combobox field for rhf and tsf ([#67](https://github.com/plvo/shuip/issues/67)) ([c47e354](https://github.com/plvo/shuip/commit/c47e354c78f9d8835cac0752b14f24ceaf5e43c9))
* **data-table:** add entity-agnostic dual-mode data-table block ([#65](https://github.com/plvo/shuip/issues/65)) ([2f46349](https://github.com/plvo/shuip/commit/2f46349d3b6912b2f1e3168a7fa09c7a5d869f85))
* **date-field:** add rhf-date-field and tsf-date-field ([#47](https://github.com/plvo/shuip/issues/47)) ([9a0e58b](https://github.com/plvo/shuip/commit/9a0e58bdaad1bcaa8865b1f5634a69e92831ccb0))
* **date-range-field:** add rhf-date-range-field and tsf-date-range-field ([#49](https://github.com/plvo/shuip/issues/49)) ([13e0765](https://github.com/plvo/shuip/commit/13e0765bb3b40635a62f12211e1aa0e4ec48f7e0))
* **datetime-field:** add rhf-datetime-field and tsf-datetime-field ([#50](https://github.com/plvo/shuip/issues/50)) ([75f593c](https://github.com/plvo/shuip/commit/75f593c75ec8be732494e06f4fb00a0271bce7c7))
* **docs:** /components gallery + top-level routing split ([#59](https://github.com/plvo/shuip/issues/59)) ([fbd0556](https://github.com/plvo/shuip/commit/fbd05561e73497f95068ef36362d9e352f2c51c2))
* **inline-edit:** add rhf/tsf inline-edit fields ([#55](https://github.com/plvo/shuip/issues/55)) ([4ee00ba](https://github.com/plvo/shuip/commit/4ee00ba9d42e79394bf2fe43df68aec6b3f9e924))
* **kanban:** add generic kanban block ([#56](https://github.com/plvo/shuip/issues/56)) ([6b14c87](https://github.com/plvo/shuip/commit/6b14c876a75c69676fc05085a62391423d813c55))
* **month-field:** add rhf-month-field and tsf-month-field ([#51](https://github.com/plvo/shuip/issues/51)) ([3bafd20](https://github.com/plvo/shuip/commit/3bafd20a74014ffaf678ef3267c0fe8ba418ef9c))
* **registry:** add tsf-form-context item ([#40](https://github.com/plvo/shuip/issues/40)) ([8da715b](https://github.com/plvo/shuip/commit/8da715beb34cd6f656ff884ef04c49e994300a1e))
* **search-input:** agnostic debounced search input with hotkey ([#68](https://github.com/plvo/shuip/issues/68)) ([1e938fc](https://github.com/plvo/shuip/commit/1e938fc6939c6be198a1b65d74a59246f2b6e085))
* **skills:** ship shuip agent skills via the registry ([#60](https://github.com/plvo/shuip/issues/60)) ([3753249](https://github.com/plvo/shuip/commit/3753249b0be579eabbdefaf0041a13bd7149d449))
* **time-field:** add rhf/tsf-time-field ([#48](https://github.com/plvo/shuip/issues/48)) ([1d7018a](https://github.com/plvo/shuip/commit/1d7018a4df3eb5339729217a6a2ca9055eab0f6d))


### Bug Fixes

* **search:** correct cmd+k result URLs missing route prefix ([#58](https://github.com/plvo/shuip/issues/58)) ([78ee232](https://github.com/plvo/shuip/commit/78ee2321483233d0f50a2cbc822f82ef535de07a))


### Code Refactoring

* **rhf-fields:** bind via @hookform/lenses ([#45](https://github.com/plvo/shuip/issues/45)) ([1cd98ba](https://github.com/plvo/shuip/commit/1cd98ba49f20043b5537afa4d40b6e8108cdffc6))
* **rhf-fields:** migrate to shadcn Field primitive, split InputField/NumberField ([#46](https://github.com/plvo/shuip/issues/46)) ([a93c13a](https://github.com/plvo/shuip/commit/a93c13a799fdff1272d27d5b049898eeb1bca6c9))
* **tsf-fields:** migrate to createFormHook context (drop form prop) ([#43](https://github.com/plvo/shuip/issues/43)) ([7ee8832](https://github.com/plvo/shuip/commit/7ee883291869c32ae9191c0265ce2340ff8a4c81))

## [1.3.0](https://github.com/plvo/shuip/compare/v1.2.0...v1.3.0) (2026-05-11)


### Features

* improve rhf fields ([#29](https://github.com/plvo/shuip/issues/29)) ([d11fb61](https://github.com/plvo/shuip/commit/d11fb614b4efadc6725a460fbe296c7e301cd9e7))
* tanstack-form integration ([#28](https://github.com/plvo/shuip/issues/28)) ([e0bd226](https://github.com/plvo/shuip/commit/e0bd226a30c595bf9ed70f3cf1e2febcc86ce1da))
* toc ([#26](https://github.com/plvo/shuip/issues/26)) ([65bff9e](https://github.com/plvo/shuip/commit/65bff9e56fec574d970741ddd888fc8239029415))


### Bug Fixes

* homepage ([1dd0005](https://github.com/plvo/shuip/commit/1dd0005d605e668b05ac0be02e4aa9e61fd74d62))
* React Flight RCE advisory ([#30](https://github.com/plvo/shuip/issues/30)) ([5bdb30a](https://github.com/plvo/shuip/commit/5bdb30ae89c32c8ebf7438e3ab3e498bde08112a))
* **registry:** move query-boundary to tanstack-query category ([#39](https://github.com/plvo/shuip/issues/39)) ([cb897b5](https://github.com/plvo/shuip/commit/cb897b59911e40cffaffd3a65489882846084d06))
* **responsive-dialog:** fix height/overflow, add `ResponsiveDialogBody` ([#33](https://github.com/plvo/shuip/issues/33)) ([4fdadc9](https://github.com/plvo/shuip/commit/4fdadc996189e96ab4f6abacb41a55704e73989e))

## [1.2.0](https://github.com/plvo/shuip/compare/v1.1.0...v1.2.0) (2025-10-08)


### Features

* improve navigation uiux, changelog pages ([#25](https://github.com/plvo/shuip/issues/25)) ([9f9ea77](https://github.com/plvo/shuip/commit/9f9ea7745aa05045bf6e4e01d3cb666da640babf))


### Bug Fixes

* hotfix responsive-dialog.mdx ([a22cf46](https://github.com/plvo/shuip/commit/a22cf466fb2b9833f3dbe771ee09e5c6fac616a1))

## [1.1.0](https://github.com/plvo/shuip/compare/v1.0.0...v1.1.0) (2025-07-31)


### Features

* new block `responsive-dialog` ([#21](https://github.com/plvo/shuip/issues/21)) ([e5a2af8](https://github.com/plvo/shuip/commit/e5a2af8ec5c34952c8c153000046d3d4a3b7ee84))
* new ui side-dialog ([#18](https://github.com/plvo/shuip/issues/18)) ([ea7096c](https://github.com/plvo/shuip/commit/ea7096c89a9ba5dc074aa6bf0bcdce9d22bbdd5d))

## 1.0.0 (2025-06-30)


### Features

* add checkbox-field component to registry ([6c3c140](https://github.com/plvo/shuip/commit/6c3c14007f988b1eefae3c7b0bbd47210df1e1b1))
* add copy-button component, update dependencies, enhance documentation ([417b211](https://github.com/plvo/shuip/commit/417b2116001a9a0ccf1442c8a5355aac11876b29))
* add query-boundary component, fix `generateStaticParams` in docs page ([068e53d](https://github.com/plvo/shuip/commit/068e53dcd29c63411fb22bf8c746c9aa042439ac))
* build-registry script & chore config ([18875b2](https://github.com/plvo/shuip/commit/18875b2f1d4e587e9980bac60eb31a3eec091f9a))
* build-registry script & chore config ([91b5021](https://github.com/plvo/shuip/commit/91b50216080cf42dc44f9bf17047fbc3b782bcc0))
* copy button, improve display mdx and code preview ([d72b970](https://github.com/plvo/shuip/commit/d72b9702afdaa1b942980620c7f4e14822b0b679))
* delete unusued script, build registry ([6871651](https://github.com/plvo/shuip/commit/6871651d0acc5b5b6f16c556c806ca725dfb991b))
* **Deps:** Import component dependencies + Shadcn components ([ed9fafc](https://github.com/plvo/shuip/commit/ed9fafc6cd88dddd5adeef9913cd8c56747ed40b))
* **docs:** display code, improve script, add mdx support foreach component ([60eeb59](https://github.com/plvo/shuip/commit/60eeb5978501832519806fb18c9ad5a06993624b))
* **docs:** enhance documentation structure and add new components ([d38017e](https://github.com/plvo/shuip/commit/d38017e91270e788752aa75a8fe8300484604598))
* **form:** Radio field ([7d954d1](https://github.com/plvo/shuip/commit/7d954d1c9e0969334bf075002e95f1e79a0a1418))
* **form:** Radio field ([9ff84d4](https://github.com/plvo/shuip/commit/9ff84d43f97bbcc07fe23aaf0852f9f89d607cf1))
* **homepage:** little list & add index registry c ([f7dd1cc](https://github.com/plvo/shuip/commit/f7dd1cc32ec12c50d60f3c721fc17c9620d39af7))
* initial commit ([c6a292c](https://github.com/plvo/shuip/commit/c6a292cac438a53820019d571c384c702ac51105))
* **page:** add grid for components list ([e63ba13](https://github.com/plvo/shuip/commit/e63ba136917527c29aaf61c6d31eb2ebe3bc5db1))
* **registry/c:** add new components ([0dcd20e](https://github.com/plvo/shuip/commit/0dcd20e7445e83276060e5d5cf7ecbc8a433079f))
* **registry:** add new components and examples for button and radio form fields ([59daaef](https://github.com/plvo/shuip/commit/59daaef698418b601958d35e0bb124085d347544))
* **registry:** add new components and examples for button and radio form fields ([d305355](https://github.com/plvo/shuip/commit/d3053553bb9e58649a518ed91c5a61827d8a4b58))
* **registry:** new components ([7e626a4](https://github.com/plvo/shuip/commit/7e626a4a4bd73a5ca5b38f03dce026fdb2e129c6))
* render exemple usage preview for each component ([7335fdc](https://github.com/plvo/shuip/commit/7335fdc79fde66e01c2cc8c55d4a90ef9b9ea4c5))
* render mdx with contentlayer ([e5c744e](https://github.com/plvo/shuip/commit/e5c744ee4f767eaa8f2e1643171a0d82b12b39be))
* **sidebar:** fix bg and add drawer for mobile ([1dc60b0](https://github.com/plvo/shuip/commit/1dc60b09d71281b895170bb52992505b8d5e2569))
* **sidebar:** improve with submenu and collapsible ([91bb589](https://github.com/plvo/shuip/commit/91bb589d4885070a7f96cc9c51c4b6d778e7d151))
* toc, display code more prettily, improve comp installation ([c674d9f](https://github.com/plvo/shuip/commit/c674d9f7f9e224c6614fcd966e6249286b75ebae))


### Bug Fixes

* 🐛 allow files in registry to be access on edge ([34f407e](https://github.com/plvo/shuip/commit/34f407e1d187294f4841201484c530a9851bb307))
* allow files in registry to be access in cloud ([60a0f17](https://github.com/plvo/shuip/commit/60a0f1744ad01f1abb63e30db88915d1233a23c6))
* **button-copy:** copy right cli value ([5090a51](https://github.com/plvo/shuip/commit/5090a518a9dc48591e390f4d7f73143b9b9fbc33))
* **componentsGRoup:** read dir ([0fe48b2](https://github.com/plvo/shuip/commit/0fe48b21d9e249fd7ac1a5ff3815c6f4b0259e8d))
* **conflicts:** Resolving conflicts ([ab62376](https://github.com/plvo/shuip/commit/ab6237627d2746b9ba6edd5c2631a190337f7b1c))
* **docs/page:** pageprops, async issues ([86a4939](https://github.com/plvo/shuip/commit/86a49397f6dbf7025d1a96913a983b52717307b5))
* **examples:** form-field components ([2078178](https://github.com/plvo/shuip/commit/2078178858017e00a6ed2aa3fddfb2994f8cde15))
* **layout:** hydration warning ([5d56b55](https://github.com/plvo/shuip/commit/5d56b5555f4ea11a7dcf83ec8de401609c246cec))
* **page:** slug async ([a823dfe](https://github.com/plvo/shuip/commit/a823dfe60e5132e7c3443444a52d9e99a355fbb4))
* **params:** page props async ([3465a35](https://github.com/plvo/shuip/commit/3465a35c1da9d0207878ab67cc28d8c1cf3eed10))
* **route:** page name ([b8e10ce](https://github.com/plvo/shuip/commit/b8e10ced0650a3ed0d864107a8dafca423992149))
* **use-toast:** es-lint ([43b38be](https://github.com/plvo/shuip/commit/43b38bead37e30802d323bea831f0332df4fecd1))


### Performance Improvements

* **docs:** add generateStaticParams ([20a14cc](https://github.com/plvo/shuip/commit/20a14ccc6566ee53fc76fd33a05e7877145f46b7))
