defmodule LiveViewModel.Test.PatchChannel do
  @moduledoc false

  use LiveViewModel.Channel, web_module: LiveViewModel.Test.Web, json_patch: true, max_version: 10

  def init(_channel, _params, _socket) do
    {:ok, %{foo: "bar"}}
  end

  def handle_event("change_foo", %{"foo" => new_foo}, _state) do
    {:noreply, %{foo: new_foo}}
  end
end
