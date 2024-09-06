defmodule DemoWeb.Socket do
  @moduledoc false
  use Phoenix.Socket

  channel("chat", DemoWeb.ChatChannel)

  @impl true
  def connect(_params, socket) do
    {:ok, socket}
  end

  @impl true
  def id(_socket) do
    nil
  end
end
