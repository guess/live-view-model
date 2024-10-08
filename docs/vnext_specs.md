
# Technical Specification for live-view-model Library

## 1. Overview

The live-view-model library is designed to synchronize state between Phoenix Channels and MobX observables in TypeScript applications. This simplified version focuses on core functionality to provide a solid foundation for future development.

## 2. Core Components

### 2.1. Socket Connection
- `LiveConnection`: Manages the WebSocket connection to the Phoenix server
- `LiveChannel`: Represents a channel subscription
- `LiveSocket`: Represents the WebSocket connection

### 2.2. Decorators
- `@liveViewModel`: Sets up a class as a live view model
- `@liveObservable`: Marks a property for synchronization with the server
  - `@liveObservable.ref`
  - `@liveObservable.struct`
  - `@liveObservable.deep`
  - `@liveObservable.shallow`
- `@localObservable`: Marks a property as a local observable (not synchronized with the server)
  - `@localObservable.ref`
  - `@localObservable.struct`
  - `@localObservable.deep`
  - `@localObservable.shallow`
- `@liveEvent`: Defines a method that sends events to the server
- `@liveError`: Specifies an error handler for the view model
- `@action`: Alias for MobX action decorator
- `@computed`: Alias for MobX computed decorator

### 2.3. Utility Functions
- `connect`: Establishes a connection to the Phoenix server

## 3. Detailed Specifications

### 3.1. PhoenixConnection

Manages the WebSocket connection to the Phoenix server using RxJS for reactive programming.

#### Methods:
- `constructor(url: string, params?: object)`
- `connect(): void`
- `disconnect(): void`
- `createChannel$(topic: string, params?: object): Observable<LiveChannel>`

#### Properties:
- `socket$: Observable<LiveSocket>`

### 3.2. Decorators

#### 3.2.1. @liveViewModel(topic: string)

Sets up a class as a live view model, connecting it to a specific Phoenix channel.

**Usage:**
```typescript
@liveViewModel("room:lobby")
class LobbyViewModel {
  // ...
}
```

**Functionality:**
- Creates a channel subscription based on the provided topic
- Sets up event listeners for incoming messages

#### 3.2.2. @liveObservable(serverKey?: string)

Marks a property for synchronization with the server and integrates with MobX to create observable properties.

**Usage:**
```typescript
@liveObservable("server_count")
count: number = 0;

@liveObservable.deep()
messages: ChatMessage[] = [];
```

**Functionality:**
- Makes the property a MobX observable
- Maps the property to a server-side key (uses the property name if not specified)
- Sets up the property for automatic updates when receiving data from the server
- Provides variants for different MobX observable types:
  - `@liveObservable.ref`: Creates a reference observable
  - `@liveObservable.struct`: Creates a structural observable
  - `@liveObservable.deep`: Creates a deep observable
  - `@liveObservable.shallow`: Creates a shallow observable

#### 3.2.3. @localObservable()

Marks a property as a local observable, not synchronized with the server.

**Usage:**
```typescript
@localObservable()
localCount: number = 0;

@localObservable.ref()
localReference: SomeType | null = null;
```

**Functionality:**
- Makes the property a MobX observable
- Does not synchronize the property with the server
- Provides variants for different MobX observable types:
  - `@localObservable.ref`: Creates a reference observable
  - `@localObservable.struct`: Creates a structural observable
  - `@localObservable.deep`: Creates a deep observable
  - `@localObservable.shallow`: Creates a shallow observable

#### 3.2.4. @liveEvent(eventName: string)

Defines a method that sends events to the server when called.

**Usage:**
```typescript
@liveEvent("notify")
notify(message: string) {
  return { message };
}
```

**Functionality:**
- Wraps the original method
- Sends the returned payload to the server using the specified event name

#### 3.2.5. @liveError

Specifies an error handler for the view model.

**Usage:**
```typescript
@liveError
handleError(error: any) {
  console.error("View model error:", error);
}
```

**Functionality:**
- Sets up a central error handler for the view model
- Called when channel errors occur

#### 3.2.6. @action()

Alias for MobX action decorator.

**Usage:**
```typescript
@action()
setCount(count: number) {
  this.count = count;
}
```

**Functionality:**
- Wraps the method in a MobX action for optimal performance when modifying observables

#### 3.2.7. @computed()

Alias for MobX computed decorator.

**Usage:**
```typescript
@computed()
get messageCount() {
  return this.messages.length;
}
```

**Functionality:**
- Creates a MobX computed property, which is automatically updated when its dependencies change

### 3.3. Utility Functions

#### 3.3.1. connect(url: string, params?: object): LiveConnection

Establishes a connection to the Phoenix server.

**Usage:**
```typescript
const connection = connect("ws://localhost:4000/lvm", { token: "mytoken" });
```

**Functionality:**
- Creates and returns a new LiveConnection instance
- Initiates the connection to the server

#### 3.3.2. join(viewModel: LiveViewModel, params?: object): void

Joins a live view model to a channel.

**Usage:**
```typescript
join(lobby);
```

**Functionality:**
- Initializes the channel connection for the view model
- Sets up event listeners and state synchronization

#### 3.3.3. leave(viewModel: LiveViewModel): void

Leaves a live view model channel.

**Usage:**
```typescript
leave(lobby);
```

**Functionality:**
- Disconnects the view model from the channel
- Cleans up event listeners and subscriptions

#### 3.3.4. setLogLevel(level: LogLevel): void

Sets the logging level for the library.

**Usage:**
```typescript
setLogLevel(LogLevel.debug);
```

**Functionality:**
- Configures the verbosity of library logging
- Accepts a LogLevel enum value

## 4. Server-Client Communication

The library uses a basic state synchronization mechanism:

- Server-to-client: When the server sends a 'sync' event, the view model updates all @liveObservable properties with the received data.
- Client-to-server: Via @liveEvent methods (for non-state-modifying events)

## 5. Error Handling

Errors are managed through the @liveError decorator. If no error handler is specified, errors are logged to the console.

## 6. MobX Integration

The library is designed to work seamlessly with MobX:

- @liveObservable properties are made MobX observables
- Updates to these properties are wrapped in MobX actions to ensure proper state tracking

## 7. Usage Example

```typescript
import { connect, liveViewModel, liveObservable, liveEvent, liveError, computed } from 'live-view-model';
import { computed, autorun } from 'mobx';

@liveViewModel("room:lobby")
class LobbyViewModel {
  @liveObservable("server_count")
  count: number = 0;

  @liveObservable("user_list")
  users: string[] = [];

  @localObservable()
  localCount: number = 0;

  @computed()
  get userCount() {
    return this.users.length;
  }

  @liveEvent("notify")
  notify(message: string) {
    return { message };
  }

  @liveError()
  handleError(error: any) {
    console.error("LobbyViewModel error:", error);
  }
}

// Usage
const connection = connect("ws://localhost:4000/socket", { token: "mytoken" });
const lobby = new LobbyViewModel(connection);

// Set up an autorun to log changes
autorun(() => {
  console.log(`Count: ${lobby.count}, Users: ${lobby.users.join(', ')}`);
});

// Interact with the view model
console.log("Initial state:", lobby.count, lobby.users);

lobby.notify("Hello, everyone!");

// The server will send updates, which will automatically update the @liveObservable properties
```

This example demonstrates:
1. Connection and view model initialization
2. Use of computed properties and MobX autorun for reactive logging
3. Event sending with payload data
4. Basic error handling

## 8. Design Decisions

- Use of decorators for a clean, declarative API
- Integration with MobX for powerful state management
- Use of RxJS for reactive programming and managing asynchronous operations
- Separation of connection management (PhoenixConnection) from view model logic for flexibility
- Simple, explicit API to reduce implementation complexity while maintaining extensibility

This simplified specification provides a focused guide for implementing the core functionality of the live-view-model library. It covers the requested features and provides a clear starting point for development, with room for future enhancements.
