defmodule LiveViewModel.Test.SchemaChannel do
  @moduledoc false

  alias LiveViewModel.Test.FakeSchema

  use LiveViewModel.Channel, web_module: LiveViewModel.Test.Web

  def init(_channel, _params, _socket) do
    {:ok,
     %{
       thing: %FakeSchema{
         foo: "bar",
         inserted_at: DateTime.utc_now(),
         updated_at: DateTime.utc_now()
       }
     }}
  end

  def handle_event("change_foo", %{"foo" => new_foo}, %{thing: thing}) do
    {:noreply,
     %{
       thing: %{thing | foo: new_foo, updated_at: DateTime.utc_now()}
     }}
  end
end
