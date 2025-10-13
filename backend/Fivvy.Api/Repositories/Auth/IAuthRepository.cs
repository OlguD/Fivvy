
using Fivvy.Api.Models;
namespace Fivvy.Api.Repositories;

public interface IAuthRepository
{
    Task<AdminDashboardModel> AdminStatsAsync(string token);
}