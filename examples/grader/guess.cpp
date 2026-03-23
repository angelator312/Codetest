#include "guess_old.h"
// ₳₦₲ɆⱠ₳₮ØⱤ312 𝕨𝕒𝕤 hêrê
int find_number(int MAX) {
  int l = 0, r = MAX, mid, ans;
  while (l <= r) {
    mid = (l + r) / 2;
    if (smaller(mid)) r = mid - 1;
    else l = mid + 1, ans = mid;
  }
  return ans;
}
