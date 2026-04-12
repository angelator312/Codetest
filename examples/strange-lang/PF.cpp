#include <iostream>
#include <vector>
// ₳₦₲ɆⱠ₳₮ØⱤ312 𝕨𝕒𝕤 hêrê
using namespace std;
int main() {
  char z;
  bool umnozhavame = 0;
  int a, out = 0, mul = 1, i = 1;
  int lastType = 1; //+1/-1
  cin >> a;
  out = a;
  while (cin >> z) {
    if (z == '=') break;
    if (z == '*' && !umnozhavame) mul = a * lastType, out -= a * lastType, umnozhavame = 1;
    cerr << i++ << ";" << out << " " << a << " " << mul << " " << umnozhavame << endl;
    cin >> a;
    if (umnozhavame) {
      if (z == '*') mul *= a;
      else out += mul, umnozhavame = 0;
    }
    if (z == '+') out += a;
    else if (z == '-') out -= a;
    if (z == '+') lastType = 1;
    if (z == '-') lastType = -1;
    cerr << out << " " << a << " " << mul << " " << umnozhavame << endl;
  }
  cout << out << endl;
}