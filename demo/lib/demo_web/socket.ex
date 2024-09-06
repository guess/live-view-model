defmodule DemoWeb.Socket do
  @moduledoc false
  use Phoenix.Socket

  channel("chat", DemoWeb.ChatChannel)

  @impl true
  def connect(%{"token" => token}, socket) when is_binary(token) do
    {:ok, socket}
  end

  @impl true
  def connect(_params, socket) do
    {:error, "unauthorized"}
  end

  @impl true
  def id(_socket) do
    nil
  end
end
