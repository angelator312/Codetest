#include <algorithm>
// https://cses.fi/problemset/task/1111
#include <array>
#include <iostream>
#include <vector>
using namespace std;
vector<int> manacher_odd(string s) {
  int n = s.size();
  s = "$" + s + "^";
  vector<int> p(n + 2);
  int l = 0, r = 1;
  for (int i = 1; i <= n; i++) {
    p[i] = min(r - i, p[l + (r - i)]);
    while (s[i - p[i]] == s[i + p[i]]) { p[i]++; }
    if (i + p[i] > r) { l = i - p[i], r = i + p[i]; }
  }
  return vector<int>(begin(p) + 1, end(p) - 1);
}
vector<int> manacher_even(string s) {
  string t;
  for (char c : s) t += "#", t += c;
  auto res = manacher_odd(t + "#");
  return vector<int>(begin(res) + 1, end(res) - 1);
}
array<int, 2> maxM(array<array<int, 2>, 2> a) {
  if (a[0][0] > a[1][0]) return a[0];
  return a[1];
}
inline array<int, 2> ma(int a, int b) { return {a, b}; }
int main() {
    ios_base::sync_with_stdio(false);cin.tie(nullptr);cout.tie(nullptr);// format-off
  string s;
  cin >> s;
  auto odd = manacher_odd(s), even = manacher_even(s);
  for (int i = 0; i < s.size() - 1; ++i) { cerr << 2*odd[i]-1 << " " << even[2 * i + 1]-1 << " "; }
  cerr << odd[s.size() - 1] << endl;
  array<int, 2> mx = {0, 0};
  for (int i = 0; i < s.size() - 1; ++i) {
    mx = maxM({ma(odd[i] * 2 - 1, 2 * i), mx});
    mx = maxM({ma(even[2 * i + 1] - 1, 2 * i + 1), mx});
  }
  mx = maxM({ma(2 * odd[s.size() - 1], 2 * (s.size() - 1)), mx});
  cerr << mx[0] << " " << mx[1] << endl;
  if (mx[1] % 2 == 0)
    for (int i = mx[1] / 2 - (mx[0] - 1) / 2; i <= mx[1] / 2 + (mx[0] - 1) / 2; ++i) cout << s[i];
  else
    for (int i = (mx[1]+1) / 2 - mx[0]/2; i <= (mx[1] + 1) / 2 + mx[0]/2-1; ++i) cout << s[i];
  cout << "\n";
}
