# Changelog

## [Unreleased]

### ✨ Added

### 🛠️ Changed

### ⚰️ Deprecated

### ⛔ Removed

### 🐛 Fixed

### 🔒 Security

## 0.3.0 (2024-11-08)

### ✨ Added

- add support for dynamic topics in `@liveViewModel` decorator
- add `@handleEvent` decorator to receive events from the server

### 🛠️ Changed

- events pushed through `push_event` get sent as `event` instead of provided name in `%Event{}`. They can instead be subscribed to through the `lvm-event` event type or `handleEvent` decorator

### 🐛 Fixed

- fix `lvm-event` events not being subscribed to

## 0.2.6 (2024-09-13)

### 🐛 Fixed

- js: export everything

## 0.2.5 (2024-09-11)

### 🐛 Fixed

- js: fix `this` not working in `liveError` decorator function

## 0.2.4 (2024-09-10)

### ✨ Added

- js: add `addSubscription` to view model

## 0.2.3 (2024-09-09)

### 🐛 Fixed

- js: fix `this` not working in `onJoin` and `onLeave`

## 0.2.2 (2024-09-09)

### ✨ Added

- js: add `onJoin` decorator
- js: add `onLeave` decorator

### 🛠️ Changed

- js: use `lodash-es` module instead

## 0.2.1 (2024-09-09)

### ✨ Added

- js: add `setValueFromPath` action in view model
- js: add `pushEvent` to view model

### 🛠️ Changed

- js: add `autoConnect` param to `connect` (default true)

## 0.2.0 (2024-09-09)

### ✨ Added

- Initial project setup
- Added support for `@liveViewModel` decorator
- Added support for `@liveObservable` decorator, including `deep`, `shallow`, `struct`, and `ref`
- Added support for `@localObservable` decorator, including `deep`, `shallow`, `struct`, and `ref`
- Added support for `@liveEvent` decorator
- Added support for `@liveError` decorator
- Added support for `@action` decorator
- Added support for `@computed` decorator
- Added demo project
- Added spec docs to reference goals and future state

### 🛠️ Changed

- Updated README with documentation
- Reorganized project

## 0.1.0 (2024-09-04)

Initial project release 🚧
