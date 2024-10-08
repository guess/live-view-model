defmodule LiveViewModel.TestHelpers do
  require Phoenix.ChannelTest
  import Phoenix.ChannelTest

  @doc """
  Pushes a live state event over the channel
  """
  def send_event(socket, event, payload) do
    push(socket, "lvm_evt:" <> event, payload)
  end

  @doc """
  Asserts that `state:change` message is received over a channel matching the specified pattern
  """
  defmacro assert_state_change(state) do
    quote do
      assert_push("state:change", %{state: unquote(state)})
    end
  end

  @doc """
  Asserts that `state:patch` message is received over a channel matching the specified pattern
  """
  defmacro assert_state_patch(patch) do
    quote do
      assert_push("state:patch", %{operations: unquote(patch)})
    end
  end
end
