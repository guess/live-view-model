defmodule LiveViewModel.BadInitChannelTest do
  use ExUnit.Case

  import Phoenix.ChannelTest
  alias LiveViewModel.Test.BadInitChannel
  alias LiveViewModel.Test.UserSocket

  @endpoint LiveViewModel.Test.Endpoint

  setup do
    start_supervised(@endpoint)
    start_supervised(Phoenix.PubSub.child_spec(name: LiveViewModel.Test.PubSub))

    {:ok, _, socket} =
      socket(UserSocket, "wut", %{})
      |> subscribe_and_join(BadInitChannel, "wutever", %{})

    {:ok, %{socket: socket}}
  end

  test "init" do
    assert_push(
      "error",
      %{message: "you stink"}
    )
  end
end
