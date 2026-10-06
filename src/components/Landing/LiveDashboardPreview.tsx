const bars = [42, 56, 48, 68, 62, 82, 74, 92, 78, 96, 88, 100];

const transactions = [
  { name: 'Fresh Market', detail: 'Groceries, today', amount: 'N$ 684.20' },
  { name: 'Salary', detail: 'Income, yesterday', amount: 'N$ 24,800.00' },
  { name: 'Spotify', detail: 'Subscription, 28 July', amount: 'N$ 69.99' },
];

const LiveDashboardPreview = () => (
  <div className="overflow-hidden rounded-2xl border border-[#d9e0e8] bg-white shadow-[0_16px_45px_rgba(21,38,60,0.08)]">
    <div className="flex h-10 items-center justify-between border-b border-[#e3e8ee] bg-[#f8fafc] px-4">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-[#c7cfd9]" />
        <span className="h-2 w-2 rounded-full bg-[#c7cfd9]" />
        <span className="h-2 w-2 rounded-full bg-[#c7cfd9]" />
      </div>
      <span className="text-[10px] text-[#8491a1]">app.mofisc.com</span>
      <div className="w-8" />
    </div>

    <div className="grid min-h-[470px] md:grid-cols-[180px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#e3e8ee] bg-[#fafbfc] p-5 md:block">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#246bfd] text-xs font-semibold text-white">M</span>
          <span className="text-sm font-semibold text-[#15263c]">Mofisc</span>
        </div>
        <nav className="space-y-1 text-xs">
          <div className="rounded-md bg-[#edf3ff] px-3 py-2.5 font-medium text-[#245dc7]">Overview</div>
          <div className="px-3 py-2.5 text-[#6d7b8d]">Insights</div>
          <div className="px-3 py-2.5 text-[#6d7b8d]">Planning</div>
          <div className="px-3 py-2.5 text-[#6d7b8d]">Subscriptions</div>
        </nav>
        <div className="mt-20 border-t border-[#e3e8ee] pt-4">
          <p className="text-[10px] font-medium text-[#15263c]">Weekly summary</p>
          <p className="mt-1 text-[10px] leading-4 text-[#7a8797]">Dining spending was lower this week.</p>
        </div>
      </aside>

      <div className="p-4 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8290a1]">Overview</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#15263c]">Good morning, Maria</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ['Total balance', 'N$ 32,480.60', 'Up 8.2% this month'],
            ['Money in', 'N$ 28,240', 'Up 4.1% this month'],
            ['Money out', 'N$ 14,126', '6.8% less spent'],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-xl border border-[#e1e6ec] p-4">
              <p className="text-[10px] text-[#718095]">{label}</p>
              <p className="mt-2 text-base font-semibold text-[#15263c] sm:text-lg">{value}</p>
              <p className="mt-1 text-[9px] text-[#48715b]">{note}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-xl border border-[#e1e6ec] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#15263c]">Cash flow</p>
                <p className="mt-0.5 text-[9px] text-[#8290a1]">Income and spending over twelve months</p>
              </div>
              <span className="text-[9px] text-[#718095]">Last 12 months</span>
            </div>
            <div className="mt-5 flex h-28 items-end gap-2 border-b border-[#e1e6ec]">
              {bars.map((height, index) => (
                <div key={index} className="flex h-full flex-1 items-end gap-0.5">
                  <span className="w-1/2 rounded-t-sm bg-[#246bfd]" style={{ height: `${height}%` }} />
                  <span className="w-1/2 rounded-t-sm bg-[#dbe5f4]" style={{ height: `${Math.max(20, height - 22)}%` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#d8e0e9] bg-[#f6f8fb] p-4">
            <p className="text-xs font-medium text-[#15263c]">Monthly note</p>
            <p className="mt-2 text-[10px] leading-5 text-[#647386]">Your flexible spending is N$ 1,240 below its usual level. You can add the difference to your emergency fund.</p>
            <button type="button" className="mt-4 rounded-md border border-[#cfd7e2] bg-white px-3 py-2 text-[10px] font-medium text-[#15263c]">Review</button>
          </div>
        </div>

        <div className="mt-3 hidden rounded-xl border border-[#e1e6ec] p-4 lg:block">
          <p className="mb-3 text-xs font-medium text-[#15263c]">Recent activity</p>
          <div className="grid grid-cols-3 gap-5">
            {transactions.map((transaction) => (
              <div key={transaction.name} className="min-w-0">
                <div className="flex justify-between gap-2">
                  <p className="truncate text-[10px] font-medium text-[#15263c]">{transaction.name}</p>
                  <p className="text-[9px] text-[#15263c]">{transaction.amount}</p>
                </div>
                <p className="mt-1 truncate text-[9px] text-[#8290a1]">{transaction.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LiveDashboardPreview;
