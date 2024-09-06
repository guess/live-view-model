# Demo

## Starting the Phoenix server

To start your Phoenix server:

  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Linking `live-view-model` to the project

In the `live-view-model` directory:
```
cd js/
yarn link
yarn build --watch
```

In the `demo/client` directory:
```
cd demo/client/
yarn link "live-view-model"
yarn dev
```

Now, any changes in `live-view-model` will automatically rebuild, and the client will use the updated version.
