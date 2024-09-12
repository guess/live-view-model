defmodule DemoWeb.ConflictChannel do
  @moduledoc false
  use LiveViewModel.Channel, web_module: DemoWeb

  @impl true
  def init(_channel, _payload, _socket) do
    # schedule_empty_map()
    {:ok, %{count: 0}}
  end

  @impl true
  def handle_event("update_count", _params, state) do
    Process.sleep(1000)
    {:noreply, state}
  end
end
