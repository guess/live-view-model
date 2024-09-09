defmodule LiveViewModel.EncoderChannelTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias LiveViewModel.Test.EncoderChannel
  alias LiveViewModel.Test.UserSocket

  import LiveViewModel.TestHelpers

  @endpoint LiveViewModel.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: LiveViewModel.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(EncoderChannel, "foo:all")

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push("state:change", %{state: %{thing: thing}, version: 0})
    assert thing == %{bing: "baz", baz: "bing"}
  end

  test "handle_event", %{socket: socket} do
    send_event(socket, "change_baz", %{"baz" => "not_bing"})

    assert_push("state:patch", %{
      version: 1,
      operations: [%{op: "replace", path: "/thing/baz", value: "not_bing"}]
    })
  end
end
