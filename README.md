# LiveViewModel

LiveViewModel is an Elixir library for building interactive web and mobile applications with a focus on real-time, event-driven architecture. It offers a unique approach to state management and client-server communication, particularly suited for applications that require real-time updates and don't rely on server-side HTML rendering.

## Table of Contents

- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Server-Side Components](#server-side-components)
- [Client-Side Components](#client-side-components)
- [Use Cases](#use-cases)
- [Getting Started](#getting-started)
  - [Server-Side Setup](#server-side-setup)
  - [Client-Side Setup](#client-side-setup)
- [Decorators](#decorators)
- [Advanced Features](#advanced-features)
- [Testing](#testing)
- [Using with React](#using-with-react)
- [Comparison to LiveView](#comparison-to-liveview)
- [Contributing](#contributing)
- [License](#license)

## Key Features

- 🏛️ **Centralized State Management**: Application state is maintained on the server, reducing complexity in state synchronization.
- 🎭 **Event-Driven Architecture**: Clients dispatch events to the server, which handles them and updates the state accordingly.
- ⚡ **Real-Time Updates**: The server pushes state changes to clients, facilitating real-time interactivity.
- 🧘 **Simplified Client Logic**: Client-side code primarily focuses on rendering state and dispatching events.
- 🌐 **Platform Agnostic**: Suitable for web applications and mobile apps that manage their own UI rendering.
- 🏷️ **TypeScript Support**: Includes TypeScript definitions for improved developer experience.
- 🔄 **Reactive Programming**: Utilizes RxJS for handling asynchronous events and state changes.
- 🔍 **MobX Integration**: Leverages MobX for efficient client-side state management and reactivity.

## How It Works

1. Clients connect to the server using WebSocket or long-polling.
2. Clients send events to the server using a defined protocol.
3. The server processes events and updates the application state.
4. Updated state is sent back to clients for rendering, either as full state updates or optimized patches.

## Server-Side Components

- `LiveViewModel.Channel`: A behavior module for creating Phoenix channels that handle LiveViewModel logic.
- `LiveViewModel.Encoder`: A protocol for customizing how data is encoded before being sent to clients.
- `LiveViewModel.Event`: A struct representing events that can be sent from the server to clients.
- `LiveViewModel.MessageBuilder`: A module for creating state change and patch messages.

## Client-Side Components

- `LiveConnection`: Manages the connection to the server and provides methods for joining channels and sending events.
- `LiveViewModel`: A decorator and base class for creating view models that sync with the server state.
- Various decorators (`@liveObservable`, `@localObservable`, `@action`, `@computed`, `@liveEvent`, `@liveError`) for defining reactive properties and methods.

## Use Cases

LiveViewModel is particularly well-suited for:
- Real-time dashboards and monitoring applications
- Collaborative tools and multi-user applications
- Mobile applications that require live updates from a server
- Single-page applications (SPAs) with complex state management needs
- Any scenario where a unified backend can serve multiple client types (web, mobile, etc.)

## Getting Started

### Server-Side Setup

1. Add LiveViewModel to your dependencies in `mix.exs`:

   ```elixir
   defp deps do
     [
       {:live_view_model, "~> 0.1.0"}
     ]
   end
   ```

2. Create a channel using `LiveViewModel.Channel`:

   ```elixir
   defmodule MyAppWeb.MyChannel do
     use LiveViewModel.Channel, web_module: MyAppWeb

     @impl true
     def init(_channel, _payload, _socket) do
       {:ok, %{count: 0}}
     end

     @impl true
     def handle_event("update_count", %{"value" => value}, state) do
       {:noreply, %{state | count: value}}
     end
   end
   ```

3. Add the channel to your socket in `lib/my_app_web/channels/user_socket.ex`:

   ```elixir
   defmodule MyAppWeb.UserSocket do
     use Phoenix.Socket

     channel "room:*", MyAppWeb.MyChannel

     # ... rest of the socket configuration
   end
   ```

### Client-Side Setup

1. Install the npm package:

   ```bash
   npm install live-view-model
   ```

2. Create a view model:

   ```typescript
   import { liveViewModel, LiveConnection, liveObservable, liveEvent } from "live-view-model";

   @liveViewModel("room:lobby")
   class MyViewModel {
     constructor(private conn: LiveConnection) {}

     @liveObservable()
     count: number = 0;

     @liveEvent("update_count")
     updateCount(value: number) {
       return { value };
     }
   }
   ```

3. Connect and use the view model:

   ```typescript
   import { connect, join } from "live-view-model";

   const conn = connect("ws://localhost:4000/socket");
   const viewModel = new MyViewModel(conn);
   join(viewModel);

   autorun(() => console.log('Count changed:', viewModel.count));

   viewModel.updateCount(5);
   viewModel.updateCount(4);
   ```

## Decorators

### @liveViewModel(topic: string)

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

### @liveObservable(serverKey?: string)

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

### @localObservable()

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

### @liveEvent(eventName: string)

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

### @liveError

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

### @action()

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

### @computed()

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

## Advanced Features

- **Custom Encoders**: Implement the `LiveViewModel.Encoder` protocol to customize how data is serialized before being sent to clients.

## Testing

The library includes `LiveViewModel.TestHelpers` module for writing tests for your LiveViewModel channels.

## Using with React

LiveViewModel integrates seamlessly with React using mobx-react-lite for efficient rendering and state management. Here's an example of how to use LiveViewModel in a React component:

1. First, install the necessary dependencies:

```bash
npm install live-view-model mobx mobx-react-lite react
```

2. Create your recat components:

```tsx
import React, { useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { connect, join, leave } from 'live-view-model'';

const App = () => {
  const conn = useMemo(() => {
    return connect('ws://localhost:4000/socket');
  }, []);

  return (
    <LobbyComponent conn={conn} />
  );
}

const LobbyComponent = observer(({ conn }) => {
  const vm = useMemo(() => {
    return new LobbyViewModel(conn);
  }, [conn]);

  useEffect(() => {
    join(vm);
    return () => leave(vm);
  }, [vm]);

  return (
    <div>
      <h1>Lobby</h1>
      <p>Count: {viewModel.count}</p>
      <button onClick={() => viewModel.increment()}>Increment</button>
      <button onClick={() => viewModel.decrement()}>Decrement</button>
    </div>
  );
});

export default App;
```

## Comparison to LiveView

While LiveViewModel shares similar goals with Phoenix LiveView, it takes a different approach:

- LiveView manages both server logic and view presentation in Elixir, primarily for web applications.
- LiveViewModel handles server logic in Elixir but relies on client-side code for rendering, making it adaptable for both web and mobile platforms.

This distinction allows LiveViewModel to be used in scenarios where full server-side rendering is not possible or desirable, such as in native mobile applications.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE.md)
