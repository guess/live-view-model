defmodule LiveViewModel.Test.EncoderChannel do
  @moduledoc false

  alias LiveViewModel.Test.OtherThing

  use LiveViewModel.Channel, web_module: LiveViewModel.Test.Web

  def init(_channel, _params, _socket) do
    {:ok,
     %{
       thing: %OtherThing{
         bing: "baz",
         baz: "bing",
         wuzzle: "wuzzle",
         __meta__: %{random: "garbage"}
       }
     }}
  end

  def handle_event("change_baz", %{"baz" => new_baz}, _state) do
    {:noreply,
     %{
       thing: %OtherThing{
         bing: "baz",
         baz: new_baz,
         wuzzle: "wuzzle",
         __meta__: %{random: "garbage"}
       }
     }}
  end
end
