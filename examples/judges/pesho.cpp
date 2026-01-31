// https://pesho.org/assignments/5113/tasks/1
#include <cstdio>
#include <iostream>
#include <vector>
#if MYFLAG
#define eprintf(args...) fprintf(stderr, args)
#else
#define eprintf(args...)
#endif
// ₳₦₲ɆⱠ₳₮ØⱤ312 𝕨𝕒𝕤 hêrê
#define int unsigned long long
using namespace std;
using num = int;
const int MAX_N = 1e6;
vector<int> graph[MAX_N];
int inComponenta[MAX_N];
vector<int> broi;
int n, m, componentsBroi = 0;
void Read() {
  ios_base::sync_with_stdio(false);
  cin.tie(nullptr);
  cout.tie(nullptr);
  cin >> n >> m;
  for (int i = 0, u, v; i < m; ++i) {
    cin >> u >> v;
    graph[u].push_back(v);
    graph[v].push_back(u);
  }
}
inline int DFS(const int u, const int inComponent) noexcept {
  int sum = 1;
  inComponenta[u] = inComponent;
  for (int v : graph[u])
    if (inComponenta[v] == 0)
      sum += DFS(v, inComponent);
  return sum;
}
signed main() {
  Read();
  for (int i = 0; i < n; ++i) {
    if (inComponenta[i] == 0)
      broi.push_back(DFS(i, ++componentsBroi));
  }
  unsigned long long maxCantBeInTeam = 0;
  int all = n;
  for (int br : broi) {
    all -= br;
    maxCantBeInTeam += br * all;
  }
  printf("%lld\n", maxCantBeInTeam);
  return 0;
}
