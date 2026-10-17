# Changelog

## [2.0.0](https://github.com/plvo/shuip/compare/v1.3.0...v2.0.0) (2026-10-17)


### ⚠ BREAKING CHANGES

* **rhf-fields:** migrate to shadcn Field primitive, split InputField/NumberField ([#46](https://github.com/plvo/shuip/issues/46))
* **rhf-fields:** `<InputField>` no longer accepts a `register` prop. Install `@hookform/lenses`, call `useLens({ control: form.control })` once, and pass focused lenses: `<InputField lens={lens.focus('x')} />`.
* **tsf-fields:** All tsf-* field components and the submit button drop the `form`, `name`, and `formProps` props. Consumers must install `tsf-form-context`, call `createFormHook` once (typically in `lib/form.ts`), and switch from `<XField form={form} name='x' .../>` to `<form.AppField name='x' children={(f) => <f.XField .../>} />`.

### Features

* **autocomplete-field:** add rhf/tsf-autocomplete-field ([#54](https://github.com/plvo/shuip/issues/54)) ([e4bc459](https://github.com/plvo/shuip/commit/e4bc4599edacb63fb2986fd1028d5cc7f4140a25))
* **calendar:** generic responsive calendar block ([#66](https://github.com/plvo/shuip/issues/66)) ([e3841ae](https://github.com/plvo/shuip/commit/e3841ae1fd84eb8703b2b5772d82ab923d69c79b))
* **combobox-field:** searchable combobox field for rhf and tsf ([#67](https://github.com/plvo/shuip/issues/67)) ([c47e354](https://github.com/plvo/shuip/commit/c47e354c78f9d8835cac0752b14f24ceaf5e43c9))
* **confirmation-dialog:** async confirm and a cancel button ([#141](https://github.com/plvo/shuip/issues/141)) ([4f71e23](https://github.com/plvo/shuip/commit/4f71e236bedd7c28d48a3e7786060f0e90dc00f9)), closes [#112](https://github.com/plvo/shuip/issues/112)
* **data-board:** paginated, groupable board block for large datasets ([#69](https://github.com/plvo/shuip/issues/69)) ([d4795cb](https://github.com/plvo/shuip/commit/d4795cb81b2ea0383852bca08a608eca91fb09a5))
* **data-table:** add entity-agnostic dual-mode data-table block ([#65](https://github.com/plvo/shuip/issues/65)) ([2f46349](https://github.com/plvo/shuip/commit/2f46349d3b6912b2f1e3168a7fa09c7a5d869f85))
* **date-field:** add rhf-date-field and tsf-date-field ([#47](https://github.com/plvo/shuip/issues/47)) ([9a0e58b](https://github.com/plvo/shuip/commit/9a0e58bdaad1bcaa8865b1f5634a69e92831ccb0))
* **date-range-field:** add rhf-date-range-field and tsf-date-range-field ([#49](https://github.com/plvo/shuip/issues/49)) ([13e0765](https://github.com/plvo/shuip/commit/13e0765bb3b40635a62f12211e1aa0e4ec48f7e0))
* **datetime-field:** add rhf-datetime-field and tsf-datetime-field ([#50](https://github.com/plvo/shuip/issues/50)) ([75f593c](https://github.com/plvo/shuip/commit/75f593c75ec8be732494e06f4fb00a0271bce7c7))
* **docs:** /components gallery + top-level routing split ([#59](https://github.com/plvo/shuip/issues/59)) ([fbd0556](https://github.com/plvo/shuip/commit/fbd05561e73497f95068ef36362d9e352f2c51c2))
* **docs:** open a preview full page with a view transition ([#149](https://github.com/plvo/shuip/issues/149)) ([bb56576](https://github.com/plvo/shuip/commit/bb565766ec1ebe0b3249d65bc9b591a0d38a4253)), closes [#120](https://github.com/plvo/shuip/issues/120)
* **docs:** serve component pages per base with a base switcher ([#94](https://github.com/plvo/shuip/issues/94)) ([d58d675](https://github.com/plvo/shuip/commit/d58d675326b4a96108636a2f5931fa778d3cba11))
* **docs:** switch primitives from a sidebar dropdown and keep tab choices ([#118](https://github.com/plvo/shuip/issues/118)) ([21a63bc](https://github.com/plvo/shuip/commit/21a63bc7e9eb020b426fed792177c9710c1483a6))
* **docs:** use the shuip mark as favicon and in the navigation ([#116](https://github.com/plvo/shuip/issues/116)) ([8a5640c](https://github.com/plvo/shuip/commit/8a5640cbc678fa4fa1d5c20a7feba607abc71eb2))
* **inline-edit:** add rhf/tsf inline-edit fields ([#55](https://github.com/plvo/shuip/issues/55)) ([4ee00ba](https://github.com/plvo/shuip/commit/4ee00ba9d42e79394bf2fe43df68aec6b3f9e924))
* **kanban:** add generic kanban block ([#56](https://github.com/plvo/shuip/issues/56)) ([6b14c87](https://github.com/plvo/shuip/commit/6b14c876a75c69676fc05085a62391423d813c55))
* **month-field:** add rhf-month-field and tsf-month-field ([#51](https://github.com/plvo/shuip/issues/51)) ([3bafd20](https://github.com/plvo/shuip/commit/3bafd20a74014ffaf678ef3267c0fe8ba418ef9c))
* **registry:** add tsf-form-context item ([#40](https://github.com/plvo/shuip/issues/40)) ([8da715b](https://github.com/plvo/shuip/commit/8da715beb34cd6f656ff884ef04c49e994300a1e))
* **registry:** anchor field popovers with base ui primitives ([#91](https://github.com/plvo/shuip/issues/91)) ([d9c9ea0](https://github.com/plvo/shuip/commit/d9c9ea086f354542cf8c8a6d943bea64936333c9))
* **registry:** compose dialog items through render on base ui ([#90](https://github.com/plvo/shuip/issues/90)) ([80d61bd](https://github.com/plvo/shuip/commit/80d61bd85b2195f7a94b52ad8f3dc430f3c85d17))
* **registry:** generate and publish the base ui variant ([#89](https://github.com/plvo/shuip/issues/89)) ([d0fd6c8](https://github.com/plvo/shuip/commit/d0fd6c8523eea2f4f60926abb4a1cdeea597bb24))
* **registry:** install items through the [@shuip](https://github.com/shuip) namespace ([#85](https://github.com/plvo/shuip/issues/85)) ([8bb200c](https://github.com/plvo/shuip/commit/8bb200c36f937c07b7472e4bc672382d2842cfff))
* **registry:** merge authored metadata and track registry files ([#158](https://github.com/plvo/shuip/issues/158)) ([d174144](https://github.com/plvo/shuip/commit/d1741443edba9c324c6bdb46bc2ea75e80cc0932)), closes [#62](https://github.com/plvo/shuip/issues/62)
* **registry:** route base styles to the base ui variant ([#93](https://github.com/plvo/shuip/issues/93)) ([31024ca](https://github.com/plvo/shuip/commit/31024caefa35331e7a03a41eb3341d0d5cad44b4))
* **search-input:** agnostic debounced search input with hotkey ([#68](https://github.com/plvo/shuip/issues/68)) ([1e938fc](https://github.com/plvo/shuip/commit/1e938fc6939c6be198a1b65d74a59246f2b6e085))
* **skills:** ship shuip agent skills via the registry ([#60](https://github.com/plvo/shuip/issues/60)) ([3753249](https://github.com/plvo/shuip/commit/3753249b0be579eabbdefaf0041a13bd7149d449))
* **time-field:** add rhf/tsf-time-field ([#48](https://github.com/plvo/shuip/issues/48)) ([1d7018a](https://github.com/plvo/shuip/commit/1d7018a4df3eb5339729217a6a2ca9055eab0f6d))
* **ui:** vendor radix-vega and base-vega primitive sets ([1c51fef](https://github.com/plvo/shuip/commit/1c51fef23b25cc0f6b72327123db9c7fb0353bab))


### Bug Fixes

* **address-field:** show why a never-picked address fails ([#138](https://github.com/plvo/shuip/issues/138)) ([31e7a91](https://github.com/plvo/shuip/commit/31e7a91131870cd3d8bcc515d7423154c6439d39)), closes [#101](https://github.com/plvo/shuip/issues/101)
* **blocks:** fit kanban and data board to their parent width ([#125](https://github.com/plvo/shuip/issues/125)) ([fc654e8](https://github.com/plvo/shuip/commit/fc654e8d4ffd413bef7284b6eb83136b1e86eed8))
* **confirmation-dialog:** close the dialog after confirming ([#124](https://github.com/plvo/shuip/issues/124)) ([f765ba4](https://github.com/plvo/shuip/commit/f765ba41b3ccdd5f6eb0369b75447ef0bb22ae15))
* **data-table:** sync the load-more callback ref on commit ([#130](https://github.com/plvo/shuip/issues/130)) ([3673b70](https://github.com/plvo/shuip/commit/3673b70b087093e460a28b59c2f820635e7fb87b)), closes [#107](https://github.com/plvo/shuip/issues/107)
* **deps:** declare each workspace's dependencies where it imports them ([#136](https://github.com/plvo/shuip/issues/136)) ([bdad590](https://github.com/plvo/shuip/commit/bdad5909430e98fa435c64be186fd1f0e65672bc)), closes [#109](https://github.com/plvo/shuip/issues/109)
* **docs:** give the sidebar base dropdown a key ([#143](https://github.com/plvo/shuip/issues/143)) ([6031b8f](https://github.com/plvo/shuip/commit/6031b8fa342ac871b5511cfbe506318d5ea01edd)), closes [#126](https://github.com/plvo/shuip/issues/126)
* **docs:** keep wide previews inside their card ([#121](https://github.com/plvo/shuip/issues/121)) ([65ceebb](https://github.com/plvo/shuip/commit/65ceebba7187e836e017e3a2cc53381fcd7ed1fd)), closes [#119](https://github.com/plvo/shuip/issues/119)
* **docs:** raise the contrast of dark code highlighting ([#162](https://github.com/plvo/shuip/issues/162)) ([45ff71f](https://github.com/plvo/shuip/commit/45ff71f29160e0d099bf2767c4cafac3b4860dcf)), closes [#160](https://github.com/plvo/shuip/issues/160)
* **docs:** raise the contrast of light code highlighting ([#159](https://github.com/plvo/shuip/issues/159)) ([c3a49f5](https://github.com/plvo/shuip/commit/c3a49f51deb5a71cbcb4510f703d535c5f9134c4)), closes [#157](https://github.com/plvo/shuip/issues/157)
* **registry:** accept nullable select values on base ui ([#92](https://github.com/plvo/shuip/issues/92)) ([b7cdd3f](https://github.com/plvo/shuip/commit/b7cdd3f1f99287711cbb3b515d455cd53614bdeb))
* **registry:** expose combobox semantics in autocomplete fields ([#131](https://github.com/plvo/shuip/issues/131)) ([4c5ba73](https://github.com/plvo/shuip/commit/4c5ba7345110d8aa8fbcecd4a43e6b1878578fa0)), closes [#100](https://github.com/plvo/shuip/issues/100)
* **registry:** hydrate the drag-and-drop and data-table blocks cleanly ([#152](https://github.com/plvo/shuip/issues/152)) ([cc89a6c](https://github.com/plvo/shuip/commit/cc89a6c8c1d4accaf61bb79999463fb023664e7a))
* **registry:** render field error messages at full contrast ([#139](https://github.com/plvo/shuip/issues/139)) ([4faee1d](https://github.com/plvo/shuip/commit/4faee1d517cf163ad705a5f42b38640ffe42d2f7))
* **registry:** report the combobox field list as closed when closed ([#150](https://github.com/plvo/shuip/issues/150)) ([242190f](https://github.com/plvo/shuip/commit/242190f44e0724e7b6eac6518ce353165493b4f6)), closes [#145](https://github.com/plvo/shuip/issues/145)
* **search:** correct cmd+k result URLs missing route prefix ([#58](https://github.com/plvo/shuip/issues/58)) ([78ee232](https://github.com/plvo/shuip/commit/78ee2321483233d0f50a2cbc822f82ef535de07a))
* **ui:** keep dark destructive button text readable on hover ([#153](https://github.com/plvo/shuip/issues/153)) ([68bfbfd](https://github.com/plvo/shuip/commit/68bfbfd13629287ada39ab1e4a77c7a55e7b3f62)), closes [#144](https://github.com/plvo/shuip/issues/144)
* **ui:** raise the contrast of the dark destructive token ([#133](https://github.com/plvo/shuip/issues/133)) ([742d95b](https://github.com/plvo/shuip/commit/742d95bd8483521540e3ca9b2c64a517d576f39f)), closes [#104](https://github.com/plvo/shuip/issues/104)
* **ui:** raise the light destructive contrast on its tints ([#142](https://github.com/plvo/shuip/issues/142)) ([83e722c](https://github.com/plvo/shuip/commit/83e722cc25faef54333e344152ef8a1a8074da47)), closes [#134](https://github.com/plvo/shuip/issues/134)
* **ui:** raise the light primary contrast on the docs tabs ([#155](https://github.com/plvo/shuip/issues/155)) ([5129b86](https://github.com/plvo/shuip/commit/5129b868bec4890aac214abb9f1b2e7515e1fbbb)), closes [#147](https://github.com/plvo/shuip/issues/147)


### Performance Improvements

* **docs:** send highlighted item sources as compact token runs ([#164](https://github.com/plvo/shuip/issues/164)) ([ac1d9f6](https://github.com/plvo/shuip/commit/ac1d9f6612d80939ef3897ccb1f84486b1e51332)), closes [#163](https://github.com/plvo/shuip/issues/163)


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
