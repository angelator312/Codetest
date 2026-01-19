#include <algorithm>
#include <array>
#include <iostream>
#include <vector>
using namespace std;
#if MYFLAG
#define eprintf(args...) fprintf(stderr, args)
#else
#define eprintf(args...)
#endif
bool walls[501][501];
int maxU[501][501];
int maxR[501][501];
int maxD[501][501];
int n, m, sSz = 0, mxDepthOfD = 0, mxDepthOfU = 0, mxDepthOfR = 0;

vector<pair<int, char>> s;
//{mxDepthOfU,mxDepthOfD,upDownAtEnd,rNapred}
vector<array<int, 4>> v;
inline bool ingrid(const int &i, const int &j) { return 0 < i && i <= n && 0 < j && j <= m; }
inline bool OKRDU(int i, int j) {
  if (walls[i][j]) return false;
  for (auto [mxDepthOfU, mxDepthOfD, upDownAtEnd, rNapred] : v) {
    if (!(maxD[i][j] > mxDepthOfD && maxU[i][j] > mxDepthOfU)) return false;
    i += upDownAtEnd;
    if (!(maxR[i][j] > rNapred)) return false;
    j += rNapred;
    if (walls[i][j] || !ingrid(i, j)) return false;
  }
  return true;
}

int main() {
  ios_base::sync_with_stdio(false);
  cin.tie(nullptr);
  cout.tie(nullptr);
  string ss;
  cin >> n >> m >> ss;
  s.push_back({0, ss[0]});
  for (auto z : ss)
    if (s.back().second == z) s.back().first++;
    else s.push_back({1, z});
  // v = {{0, 0, 0, 1}, {1, 1, -1, 1}};
  int x = 0;
  for (auto [b, c] : s) {
    if (c == 'R') {
      v.push_back({mxDepthOfU, mxDepthOfD, x, b});
      x = 0;
      mxDepthOfU = 0;
      mxDepthOfD = 0;
    } else if (c == 'U') {
      x -= b;
    } else if (c == 'D') {
      x += b;
    }
    if (x > 0) mxDepthOfD = max(mxDepthOfD, x);
    else if (x < 0) mxDepthOfU = max(mxDepthOfU, -x);
  }
  if (mxDepthOfD || mxDepthOfU) v.push_back({mxDepthOfU, mxDepthOfD, x, 0});
  // for (auto [a, b, c, d] : v) eprintf("{%d %d %d %d},", a, b, c, d);
  // for (auto [b, c] : s)
  //   cerr << b << c;
  // cerr << endl;
  char z;
  for (int i = 1; i <= n; ++i)
    for (int j = 1; j <= m; ++j) {
      cin >> z;
      if (z == '#') walls[i][j] = true;
    }

  int br = 0;
  for (int i = 1; i <= n; ++i)
    for (int j = m; j > 0; --j) {
      maxR[i][j] = maxR[i][j + 1] + 1;
      if (walls[i][j]) maxR[i][j] = 0;
    }
  for (int i = 1; i <= n; ++i) {
    for (int j = 1; j <= m; ++j) {
      maxU[i][j] = maxU[i - 1][j] + 1;
      if (walls[i][j]) maxU[i][j] = 0;
    }
  }
  for (int j = 1; j <= m; ++j) {
    for (int i = n; i > 0; --i) {
      maxD[i][j] = maxD[i + 1][j] + 1;
      if (walls[i][j]) maxD[i][j] = 0;
    }
  }
  int startI = 1, startJ = 1, endJ = m;
  auto *OK = OKRDU;
  for (int i = startI; i <= n; ++i) {
    for (int j = startJ; j <= endJ; ++j) {
      // bool a = OK(i, j);
      // eprintf("%d ", a);
      br += OK(i, j);
    }
    // eprintf("\n");
  }
  cout << br << endl;
  return 0;
}