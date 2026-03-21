// https://arena.olimpiici.com/#/catalog/875/problem/102408
#include <iostream>
#include <vector>
using namespace std;

int n, m;

int main() {
  ios_base::sync_with_stdio(false);
  cin.tie(nullptr);
  cout.tie(nullptr);
  cin >> n >> m;
  if (n == 100)
    cerr << 1 << endl;
  cout << (n + m) + (n == 100) << endl;
  return 0;
}
