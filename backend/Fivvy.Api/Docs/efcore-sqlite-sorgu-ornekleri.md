# EF Core ve SQLite Icin LINQ Sorgu Ornekleri

Bu dosya EF Core kullanan C# projelerinde (ornegin `DashboardRepository` icindeki gibi) sik rastlanan sorgu senaryolarini LINQ ile nasil yazabilecegini gosterir. Tum ornekler `_context` adli `AppDbContext` uzerinden baslatilir ve SQLite ile uyumludur.

> Not: Her sorgu `IQueryable` uzerinde kurulur; `ToListAsync`, `FirstOrDefaultAsync`, `CountAsync` gibi metodlar sorguyu veritabanina gonderip sonucu getirir.

## Temel Filtreleme (WHERE)

```csharp
var activeClients = await _context.Clients
    .Where(c => c.UserId == userId && c.IsActive)
    .OrderBy(c => c.CompanyName)
    .ToListAsync();
```

## Belirli Kolonlari Secme (SELECT)

```csharp
var clientSummaries = await _context.Clients
    .Where(c => c.UserId == userId)
    .Select(c => new { c.Id, c.CompanyName, c.Email })
    .ToListAsync();
```

## Kumeleme ve Toplam (GROUP BY, SUM)

```csharp
var revenueByMonth = await _context.Invoices
    .Where(i => i.InvoiceDate >= sixMonthsAgo)
    .GroupBy(i => new { i.InvoiceDate.Year, i.InvoiceDate.Month })
    .Select(g => new
    {
        Year = g.Key.Year,
        Month = g.Key.Month,
        Total = g.Sum(x => x.Amount)
    })
    .OrderBy(g => g.Year)
    .ThenBy(g => g.Month)
    .ToListAsync();
```

## Sayma (COUNT)

```csharp
var activeProjectCount = await _context.Projects
    .Where(p => clientIds.Contains(p.ClientId) && (p.EndDate == null || p.EndDate >= DateTime.UtcNow))
    .CountAsync();
```

## Ortalama ve Diger Agregatlar (AVERAGE)

```csharp
var avgDelivery = await _context.Projects
    .Where(p => p.EndDate != null)
    .AverageAsync(p => EF.Functions.DateDiffDay(p.StartDate, p.EndDate!.Value));
```

SQLite DateDiff desteklemez, bu nedenle UTC farkini C# tarafinda da hesaplayabilirsin:

```csharp
var avgDeliveryDays = await _context.Projects
    .Where(p => p.EndDate != null)
    .Select(p => (p.EndDate!.Value - p.StartDate).TotalDays)
    .AverageAsync();
```

## Join Kullanmadan Baglanti Ile Sorgu (Navigation)

```csharp
var projectWithClient = await _context.Projects
    .Where(p => p.Id == projectId && p.Client.UserId == userId)
    .Select(p => new
    {
        p.ProjectName,
        ClientName = p.Client.CompanyName
    })
    .FirstOrDefaultAsync();
```

## Explicit Join (LINQ Join)

```csharp
var projectInvoices = await _context.Projects
    .Join(
        _context.Invoices,
        project => project.Id,
        invoice => invoice.ProjectId,
        (project, invoice) => new { project.ProjectName, invoice.InvoiceNumber, invoice.Amount })
    .Where(x => x.project.UserId == userId)
    .ToListAsync();
```

## Include ile Ilişkili Verileri Cekme

```csharp
var clientsWithProjects = await _context.Clients
    .Where(c => c.UserId == userId)
    .Include(c => c.Projects)
    .ToListAsync();
```

## Distinct Degerler

```csharp
var industries = await _context.Clients
    .Where(c => c.UserId == userId)
    .Select(c => c.Industry)
    .Where(industry => industry != null)
    .Distinct()
    .ToListAsync();
```

## Sayfalama (Skip/Take)

```csharp
var page = 2;
var pageSize = 20;

var pagedActivities = await _context.ActivityLogs
    .Where(a => a.UserId == userId)
    .OrderByDescending(a => a.Timestamp)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

## Subquery (Ic Sorgu)

```csharp
var clientIds = _context.Clients
    .Where(c => c.UserId == userId)
    .Select(c => c.Id);

var invoices = await _context.Invoices
    .Where(i => clientIds.Contains(i.ClientId))
    .ToListAsync();
```

## Koşullu Secmeler (CASE benzeri)

```csharp
var pipelineInsights = await _context.Projects
    .Where(p => p.Client.UserId == userId)
    .GroupBy(p => p.Client.CompanyName)
    .Select(g => new
    {
        Key = EF.Functions.Replace(g.Key.ToLower(), " ", "-"),
        Total = g.Count(),
        Completed = g.Count(p => p.EndDate != null)
    })
    .OrderByDescending(x => x.Total)
    .Take(3)
    .ToListAsync();
```

## Raw SQL Kullanimina Ornek (Gerekirse)

```csharp
var results = await _context.Set<DashboardRevenuePointModel>()
    .FromSqlRaw("SELECT Year, Month, SUM(Amount) AS Amount FROM InvoiceSummary WHERE UserId = {0}", userId)
    .ToListAsync();
```

## Performans Icin Notlar

- `AsNoTracking()` okuma senaryolarinda takip maliyetini kaldirir.
- `Projection` (sadece gerek duyulan kolonlari secmek) SQLite uzerinde veri miktarini azaltir.
- Aynı `IQueryable` uzerinde birden cok kez `ToListAsync` cagirmamaya calis; gerekiyorsa sonucu once degiskene al.
- Tarih karsilastirmalarinda `DateTimeKind.Utc` kullanarak tutarlilik sagla.
- Agir raporlama sorgularinda gorunum (view) veya materialized view benzeri yapilar dusunulebilir.
