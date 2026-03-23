#include<iostream>
// #include "guess.h"
#include "guess.cpp"
using namespace std;
int n;
bool smaller (int x) {
    if (n<x) return true;
    return false;
}
int main () {
    int MAX,res;
    cin >> MAX >> n ;
    res=find_number(MAX);
    cout << res ;
    cout << endl ;
    return 0;
}
