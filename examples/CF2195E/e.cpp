#include <algorithm>
#include <iostream>
using namespace std;
const int N = 3e5 + 1, MOD = 1e9 + 7;
int dp[N], anS[N], parS[N], lS[N], rS[N];
bool isLeaf[N];

void dfs1(int u) {
  if (isLeaf[u]) return;
  dfs1(lS[u]);
  dfs1(rS[u]);
  dp[u] = 4 + dp[lS[u]] + dp[rS[u]];
  dp[u] %= MOD;
}
void dfs2(int u) {
  anS[u] = 1 + dp[u] + anS[parS[u]];
  anS[u] %= MOD;
  if (isLeaf[u]) return;
  dfs2(lS[u]);
  dfs2(rS[u]);
}

void Solve() {
  int n;
  cin >> n;
  fill_n(anS, n + 1, 0);
  fill_n(dp, n + 1, 0);
  fill_n(isLeaf, n + 1, 0);
  parS[1] = 0;
  for (int i = 1; i <= n; ++i) {
    cin >> lS[i] >> rS[i];
    if (lS[i] == rS[i] && lS[i] == 0) isLeaf[i] = true;
    else parS[lS[i]] = i, parS[rS[i]] = i;
  }
  dfs1(1);
  dfs2(1);
  // for (int i = 1; i <= n; ++i) cerr << isLeaf[i] << " ";
  // cerr << "\n";
  // for (int i = 1; i <= n; ++i) cerr << dp[i] << " ";
  // cerr << "\n";
  for (int i = 1; i <= n; ++i) cout << anS[i] << " ";
  cout << "\n";
}

int main(){int t;cin>>t;while(t--)Solve();} // format-off
