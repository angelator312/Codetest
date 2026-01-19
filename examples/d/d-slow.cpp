#include <iostream>
#include <vector>
using namespace std;
#if MYFLAG
#define eprintf(args...) fprintf(stderr, args)
#else
#define eprintf(args...)
#endif
bool walls[501][501];
int n, m, sSz = 0;
string s;
inline bool ingrid(const int &i, const int &j) { return 0 < i && i <= n && 0 < j && j <= m; }
inline bool OK(int i, int j) {
  if (walls[i][j]) return false;
  for (int idx = 0; idx < sSz; ++idx) {
    if (s[idx] == 'D') { ++i; }
    if (s[idx] == 'U') { --i; }
    if (s[idx] == 'R') { ++j; }
    if (walls[i][j] || !ingrid(i, j)) return false;
  }
  return true;
}

int main() {
  ios_base::sync_with_stdio(false);
  cin.tie(nullptr);
  cout.tie(nullptr);
  cin >> n >> m >> s;
  char z;
  for (int i = 1; i <= n; ++i)
    for (int j = 1; j <= m; ++j) {
      cin >> z;
      if (z == '#') walls[i][j] = true;
    }
  sSz = s.size();
  int br = 0;
  for (int i = 1; i <= n; ++i) {
    for (int j = 1; j <= m; ++j) {
      bool a = OK(i, j);
      // eprintf("%d ", a);
      br += OK(i, j);
    }
    // eprintf("\n");
  }
  cout << br << endl;
  return 0;
}