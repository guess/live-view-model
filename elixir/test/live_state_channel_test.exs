defmodule LiveViewModel.LiveViewModelChannelTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias LiveViewModel.Test.TodoChannel
  alias LiveViewModel.Test.UserSocket

  import LiveViewModel.TestHelpers

  @endpoint LiveViewModel.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: LiveViewModel.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(TodoChannel, "todos:all", %{"token" => "footoken"})

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push(
      "state:change",
      %{state: %{todos: [], token: "footoken"}, version: 0}
    )
  end

  test "handle_event", %{socket: socket} do
    send_event(socket, "add_todo", %{"description" => "Do the thing"})
    assert_state_change(%{todos: [%{"description" => "Do the thing"}]})
  end

  test "handle_message" do
    Phoenix.PubSub.broadcast(
      LiveViewModel.Test.PubSub,
      "todos",
      {:todo_added, %{"description" => "And another one"}}
    )

    assert_push("reply_event", %{foo: "bar"})

    assert_push("state:change", %{
      state: %{todos: [%{"description" => "And another one"}]},
      version: 1
    })
  end

  test "handle_event with reply", %{socket: socket} do
    push(socket, "lvm_evt:add_todo_with_one_reply", %{"description" => "Do the thing"})

    assert_push("state:change", %{
      state: %{todos: [%{"description" => "Do the thing"}]},
      version: 1
    })

    assert_push("reply_event", %{foo: "bar"})
  end

  test "handle_event with multi event reply", %{socket: socket} do
    push(socket, "lvm_evt:add_todo_with_two_replies", %{"description" => "Do the thing"})

    assert_push("state:change", %{
      state: %{todos: [%{"description" => "Do the thing"}]},
      version: 1
    })

    assert_push("reply_event1", %{foo: "bar"})
    assert_push("reply_event2", %{bing: "baz"})
  end
end
