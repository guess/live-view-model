defmodule LiveViewModel.Test.SocketyChannel do
  @moduledoc false

  use LiveViewModel.Channel, web_module: LiveViewModel.Test.Web

  @impl true
  def init(_channel, _payload, socket) do
    {:ok, %{foo: "bar"}, socket |> assign(:baz, "bing")}
  end

  @impl true
  def handle_event(
        "something_sockety",
        %{"baz" => new_baz},
        %{foo: foo},
        %{assigns: %{baz: _baz}} = socket
      ) do
    {:noreply, %{foo: "altered #{foo}"}, socket |> assign(:baz, new_baz)}
  end
end
