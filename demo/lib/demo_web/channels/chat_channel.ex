defmodule QultrWeb.ChatChannel do
  @moduledoc false
  use LiveViewModel.Channel, web_module: DemoWeb

  def init(_channel, _payload, _socket) do
    {:ok, %{}}
  end

  def handle_event("send_message", _params, state) do
    {:noreply, state}
  end
end
