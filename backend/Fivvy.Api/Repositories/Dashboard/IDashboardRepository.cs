
using System;
using System.Threading.Tasks;
using Fivvy.Api.Models;

namespace Fivvy.Api.Repositories;

public interface IDashboardRepository
{
    Task<DashboardModel> OverviewAsync(string token);
    Task<ActivityModel> GetActivitiesAsync(string token, int page = 1, int pageSize = 20);
}