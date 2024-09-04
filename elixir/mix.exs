defmodule LiveViewModel.MixProject do
  use Mix.Project

  def project do
    [
      app: :live_view_model,
      version: "0.1.0",
      elixir: "~> 1.17",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(:dev), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:phoenix, ">= 1.5.7"},
      {:ex_doc, ">= 0.0.0"},
      {:jsonpatch, "~> 2.2"},
      {:jason, ">= 0.0.0"},
      {:ecto, ">= 0.0.0", only: [:dev, :test]}
    ]
  end
end
