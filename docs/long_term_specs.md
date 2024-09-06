# Technical Specification for live-view-model Library

## 1. Overview

The live-view-model library is designed to synchronize state between Phoenix Channels and MobX observables in TypeScript applications. It provides a set of decorators and utility functions to create view models that automatically sync with the server, handle events, and manage errors.

## 2. Core Components

### 2.1. Socket Connection
- `LiveConnection`: Manages the WebSocket connection to the Phoenix server
- `LiveChannel`: Represents a channel subscription
- `LiveSocket`: Represents the WebSocket connection

### 2.2. Decorators
- `@liveViewModel`: Sets up a class as a live view model
- `@liveObservable`: Marks a property for synchronization with the server
- `@liveEvent`: Defines a method that sends events to the server
- `@liveAction`: Defines a method that modifies server state
- `@liveError`: Specifies an error handler for the view model
- `@onJoin`: Specifies a method to be called when the channel is joined
- `@onLeave`: Specifies a method to be called when the channel is left

### 2.3. Utility Functions
- `connect`: Establishes a connection to the Phoenix server
- `runInLiveAction`: Runs multiple state changes as a single live action

## 3. Detailed Specifications

### 3.1. PhoenixConnection

The PhoenixConnection class manages the WebSocket connection to the Phoenix server. It uses RxJS for reactive programming.

#### Methods:
- `constructor(url: string, params?: object)`
- `updateParams(params: object): void`
- `connect(): void`
- `disconnect(): void`
- `createChannel$(topic: string, params?: object): Observable<LiveChannel>`

#### Properties:
- `socket: LiveSocket | null`
- `socket$: Observable<LiveSocket>`

### 3.2. Decorators

#### 3.2.1. @liveViewModel(topic: string)

This decorator sets up a class as a live view model, connecting it to a specific Phoenix channel.

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
- Manages the lifecycle of the view model

#### 3.2.2. @liveObservable(serverKey?: string)

This decorator marks a property for synchronization with the server and integrates with MobX to create observable properties.

**Usage:**
```typescript
@liveObservable("server_count")
count: number = 0;
```

**Functionality:**
- Makes the property a MobX observable
- Maps the property to a server-side key (uses the property name if not specified)
- Sets up the property for automatic updates when receiving data from the server

#### 3.2.3. @liveEvent(eventName: string)

This decorator defines a method that sends events to the server when called.

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

#### 3.2.4. @liveAction

This decorator defines a method that modifies local state and synchronizes the changes with the server.

**Usage:**
```typescript
@liveAction
updateCount(newCount: number) {
  this.count = newCount;
}
```

**Functionality:**
- Wraps the original method in a MobX action
- Executes the method to update local state
- Sends the changes to the server after execution
- Reconciles local state with server response if needed

#### 3.2.5. @liveError

This decorator specifies an error handler for the view model.

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

#### 3.2.6. @onJoin

This decorator specifies a method to be called when the channel is successfully joined.

**Usage:**
```typescript
@onJoin
handleJoin() {
  console.log("Successfully joined the channel");
}
```

**Functionality:**
- Called when the Phoenix channel is successfully joined
- Can be used for initialization logic or to trigger initial data fetching

#### 3.2.7. @onLeave

This decorator specifies a method to be called when the channel is left or disconnected.

**Usage:**
```typescript
@onLeave
handleLeave() {
  console.log("Left the channel");
}
```

**Functionality:**
- Called when the Phoenix channel is left or disconnected
- Can be used for cleanup logic or to handle disconnection gracefully

### 3.3. Utility Functions

#### 3.3.1. connect(url: string, params?: object): PhoenixConnection

This function establishes a connection to the Phoenix server.

**Usage:**
```typescript
const connection = connect("ws://localhost:4000/socket", { token: "mytoken" });
```

**Functionality:**
- Creates and returns a new PhoenixConnection instance
- Initiates the connection to the server

#### 3.3.2. runInLiveAction(viewModel: any, callback: () => void): void

This function allows running multiple state changes as a single live action, batching updates to the server.

**Usage:**
```typescript
runInLiveAction(lobby, () => {
  lobby.count = 10;
  lobby.users.push("Alice");
});
```

**Functionality:**
- Wraps the callback in a MobX action
- Executes the callback to update local state
- Collects all changes made in the callback
- Sends a single batched update to the server with all changes
- Reconciles local state with server response if needed

## 4. Server-Client Communication

The library uses a comprehensive state synchronization mechanism:

- Server-to-client: When the server sends a 'sync' event, the view model updates all @liveObservable properties with the received data.
- Client-to-server:
- Through @liveAction methods
- Using runInLiveAction for batched updates
- Via @liveEvent methods (for non-state-modifying events)

### 4.1. Payload Structure

The library uses a standardized payload structure for communication between the client and server:

```typescript
interface Payload {
  type: 'sync' | 'action' | 'event';
  data: {
    [key: string]: any;
  };
}
```

- For 'sync' type: The `data` field contains the full or partial state to be synchronized.
- For 'action' type: The `data` field contains the action name and parameters.
- For 'event' type: The `data` field contains the event name and any associated data.

### 4.2. Handling Disconnections and Reconnections

The library automatically handles disconnections and reconnections:

- On disconnection: The library will queue any actions or events that occur while disconnected.
- On reconnection: The library will:
  1. Rejoin the channel
  2. Request a full state sync from the server
  3. Apply any queued actions or events

### 4.3. State Reconciliation

After a live action or batched update:

1. The library applies changes to the local state immediately.
2. When the server responds, the library compares the server state with the local state.
3. If there are discrepancies, the server state takes precedence, and the library updates the local state accordingly.
4. Any MobX computeds or reactions will run based on the final reconciled state.

## 5. Error Handling

Errors are managed through the @liveError decorator. If no error handler is specified, errors are logged to the console.

## 6. MobX Integration

The library is designed to work seamlessly with MobX:

- @liveObservable properties are made MobX observables
- Updates to these properties are wrapped in MobX actions to ensure proper state tracking
- @liveAction methods are wrapped in MobX actions
- runInLiveAction uses MobX actions for batched updates

## 7. Usage Example

```typescript
import {
  connect,
  liveViewModel,
  liveObservable,
  liveEvent,
  liveAction,
  liveError,
  onJoin,
  onLeave,
  runInLiveAction
} from 'live-view-model';
import { computed, autorun } from 'mobx';

@liveViewModel("room:lobby")
class LobbyViewModel {
  @liveObservable("server_count")
  count: number = 0;

  @liveObservable("user_list")
  users: string[] = [];

  @liveObservable("last_update")
  lastUpdate: Date = new Date();

  @computed
  get userCount() {
    return this.users.length;
  }

  @liveEvent("notify")
  notify(message: string) {
    return { message, timestamp: new Date() };
  }

  @liveAction
  updateCount(newCount: number) {
    this.count = newCount;
    this.lastUpdate = new Date();
  }

  @liveAction
  addUser(username: string) {
    this.users.push(username);
    this.lastUpdate = new Date();
  }

  @liveError
  handleError(error: any) {
    console.error("LobbyViewModel error:", error);
  }

  @onJoin
  handleJoin() {
    console.log("Joined lobby channel");
    this.notify("New user joined the lobby");
  }

  @onLeave
  handleLeave() {
    console.log("Left lobby channel");
  }
}

// Usage
const connection = await connect("ws://localhost:4000/socket", { token: "mytoken" });
const lobby = new LobbyViewModel(connection);

// Set up an autorun to log changes
autorun(() => {
  console.log(`Count: ${lobby.count}, Users: ${lobby.users.join(', ')}, Last Update: ${lobby.lastUpdate}`);
});

// Interact with the view model
console.log("Initial state:", lobby.count, lobby.users);

lobby.updateCount(5);
lobby.addUser("Alice");

lobby.notify("Hello, everyone!");

runInLiveAction(lobby, () => {
  lobby.count = 10;
  lobby.users.push("Bob");
});

// Simulate disconnection
connection.disconnect();

// These actions will be queued
lobby.updateCount(15);
lobby.addUser("Charlie");

// Simulate reconnection
connection.connect();

console.log("Final state:", lobby.count, lobby.users, lobby.lastUpdate);
```

This example demonstrates:
1. Asynchronous connection and view model initialization
2. Use of computed properties and MobX autorun for reactive logging
3. Multiple @liveAction methods with automatic lastUpdate tracking
4. Event sending with additional payload data
5. Batched updates using runInLiveAction
6. Handling of disconnection and reconnection scenarios
7. Error handling and lifecycle method usage

## 8. Future Considerations

- Implement optimistic updates for @liveAction and runInLiveAction
- Add support for handling conflicts between client and server state
- Implement a more sophisticated batching mechanism for runInLiveAction
- Add support for custom serialization/deserialization of complex types
- Implement automatic client-to-server synchronization for @liveObservable properties
- Add support for handling disconnections and reconnections gracefully

## 9. Design Decisions

- Use of decorators for a clean, declarative API
- Integration with MobX for powerful state management
- Use of RxJS for reactive programming and managing asynchronous operations
- Separation of connection management (PhoenixConnection) from view model logic for flexibility
- Simple, explicit API to reduce implementation complexity while maintaining extensibility
- Introduction of @liveAction for explicit server-state modifying methods
- Addition of runInLiveAction for batched updates, allowing more efficient state synchronization
- Implementation of @onJoin and @onLeave decorators for better lifecycle management
- Clear separation between @liveEvent (for non-state-modifying events) and @liveAction (for state-modifying actions)

This specification provides a comprehensive guide for implementing the live-view-model library, balancing functionality with simplicity and extensibility. It covers all the requested features and provides a clear roadmap for development and future enhancements.
