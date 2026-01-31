// https://judge.yosupo.jp/problem/enumerate_palindromes
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
int main() {
    ios_base::sync_with_stdio(false);cin.tie(nullptr);cout.tie(nullptr);// format-off
  string s;
  cin >> s;
  auto odd = manacher_odd(s), even = manacher_even(s);
  for (int i = 0; i < s.size(); ++i) { cerr << 2 * odd[i] - 1 << " "; }
  cerr << endl;
  for (int i = 0; i < s.size(); ++i) { cerr << even[i] - 1 << " "; }
  cerr << endl;
  for (int i = 0; i < s.size() - 1; ++i) { cout << 2 * odd[i] - 1 << " " << even[2 * i + 1] - 1 << " "; }
  cout << 2 * odd[s.size() - 1] - 1;
  cout << "\n";
}
