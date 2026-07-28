using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace UPTAdminAgent
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly HttpClient _httpClient;
        private const string ApiUrl = "http://localhost:3001/api/v1/agent/heartbeat";

        public Worker(ILogger<Worker> logger)
        {
            _logger = logger;
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("UPT Admin Agent iniciado com sucesso na VM.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Enviando heartbeat para a API administrativa local...");
                try
                {
                    var payload = new
                    {
                        AgentId = Environment.MachineName,
                        Status = "ONLINE",
                        Timestamp = DateTime.UtcNow
                    };

                    var content = new StringContent(
                        JsonSerializer.Serialize(payload),
                        Encoding.UTF8,
                        "application/json"
                    );

                    var response = await _httpClient.PostAsync(ApiUrl, content, stoppingToken);
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Heartbeat aceito pela API.");
                    }
                    else
                    {
                        _logger.LogWarning($"Falha no heartbeat. Código de status: {response.StatusCode}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Erro ao tentar comunicar com a API local: {ex.Message}");
                }

                await Task.Delay(30000, stoppingToken); // Heartbeat a cada 30 segundos
            }
        }
    }
}
