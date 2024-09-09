# LiveViewModel

LiveViewModel is an Elixir library for building interactive web and mobile applications with a focus on real-time, event-driven architecture. It offers a unique approach to state management and client-server communication, particularly suited for applications that require real-time updates and don't rely on server-side HTML rendering.

## Key Features

- **Centralized State Management**: Application state is maintained on the server, reducing complexity in state synchronization.
- **Event-Driven Architecture**: Clients dispatch events to the server, which handles them and updates the state accordingly.
- **Real-Time Updates**: The server pushes state changes to clients, facilitating real-time interactivity.
- **Simplified Client Logic**: Client-side code primarily focuses on rendering state and dispatching events.
- **Platform Agnostic**: Suitable for web applications and mobile apps that manage their own UI rendering.
- **TypeScript Support**: Includes TypeScript definitions for improved developer experience.
- **Reactive Programming**: Utilizes RxJS for handling asynchronous events and state changes.
- **MobX Integration**: Leverages MobX for efficient client-side state management and reactivity.

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
     def handle_event("increment", _payload, state) do
       {:noreply, %{state | count: state.count + 1}}
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

     @liveEvent("increment")
     increment() {
       // This will send an event to the server
     }
   }
   ```

3. Connect and use the view model:

   ```typescript
   import { connect, join } from "live-view-model";

   const conn = connect("ws://localhost:4000/socket");
   const viewModel = new MyViewModel(conn);
   join(viewModel);

   // Now you can use viewModel.count and viewModel.increment()
   ```

## Advanced Features

- **Custom Encoders**: Implement the `LiveViewModel.Encoder` protocol to customize how data is serialized before being sent to clients.
- **Error Handling**: Use the `@liveError` decorator to handle errors from the server.
- **Computed Properties**: Use the `@computed` decorator to define properties that automatically update based on other observable properties.
- **Local State**: Use `@localObservable` for client-side-only state that doesn't sync with the server.

## Testing

The library includes `LiveViewModel.TestHelpers` module for writing tests for your LiveViewModel channels.

## Comparison to LiveView

While LiveViewModel shares similar goals with Phoenix LiveView, it takes a different approach:

- LiveView manages both server logic and view presentation in Elixir, primarily for web applications.
- LiveViewModel handles server logic in Elixir but relies on client-side code for rendering, making it adaptable for both web and mobile platforms.

This distinction allows LiveViewModel to be used in scenarios where full server-side rendering is not possible or desirable, such as in native mobile applications.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE.md)
