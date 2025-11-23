import useSWR from "swr";

const fetchAPI = async (key: string) => {
  const response = await fetch(key);
  return response.json();
};

type HealthDataProps = {
  update_at: string;
  dependencies: {
    database: {
      version: string;
      max_connections: number;
      opened_connections: number;
    };
  };
};

const HealthData = () => {
  const { data, error, isLoading } = useSWR<HealthDataProps>(
    "/api/v1/status",
    fetchAPI,
    {
      refreshInterval: 2000,
    },
  );

  if (error) {
    return (
      <div>
        <h2>Não foi possível buscar as informações sobre a saúde do sistema</h2>
      </div>
    );
  }

  return (
    <div>
      <p>
        Última atualização:{" "}
        <span>
          {!data || isLoading
            ? "Carregando..."
            : new Date(data.update_at).toLocaleString("pt-BR")}
        </span>
      </p>

      <div>
        <h2>Database</h2>

        {!data || isLoading ? (
          <span>Carregando...</span>
        ) : (
          <>
            <p>
              Versão: <span>{data.dependencies.database.version}</span>
            </p>
            <p>
              Número máximo de conexões:{" "}
              <span>{data.dependencies.database.max_connections}</span>
            </p>
            <p>
              Conexões abertas:{" "}
              <span>{data.dependencies.database.opened_connections}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default HealthData;
