defmodule LiveViewModel.MixProject do
  use Mix.Project

  @version "0.1.0"
  @description "Manage web application state"
  @source_url "https://github.com/guess/live-view-model"

  def project do
    [
      app: :live_view_model,
      version: @version,
      elixir: "~> 1.17",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      description: @description,
      package: package(),
      docs: docs()
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(:dev), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp package do
    [
      maintainers: ["Steve Strates"],
      licenses: ["MIT"],
      links: %{"Github" => @source_url}
    ]
  end

  defp docs do
    [
      main: "readme",
      source_url: @source_url,
      source_ref: "v#{@version}",
      extras: [
        "README.md",
        "../CHANGELOG.md"
      ]
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:ecto, ">= 0.0.0", only: [:dev, :test]},
      {:ex_doc, ">= 0.0.0", only: :dev},
      {:jason, ">= 0.0.0"},
      {:jsonpatch, "~> 2.2"},
      {:phoenix, ">= 1.5.7"}
    ]
  end
end
