#include <stdio.h>
#include <string.h>
#define TRACE 1
char prog[256][32];
int cnt = 0;
int currRow = 0;
int charIn = 0;
char Instr[12][10] = {"READINT", "READCHAR", "IF", "ENDIF", "STORE", "COPY", "ADD", "SUB", "MUL", "REPEAT", "LOOP", "STOP"};
struct {
  long long IN, A, B, C;
} PF;
int getInstrNo(const char *p) {
  for (int i = 0; i < 12; i++)
    if (!strcmp(Instr[i], p)) return i;
  return -1;
}
char *readLine(FILE *f, char *s) {
  fgets(s, 255, f);
  if (feof(f)) return s;
  int p = strlen(s);
  while (p > 0 && s[p] <= ' ') s[p--] = 0;
  return s;
}
int readNext(FILE *f, char *s) {
  fscanf(f, "%s", s);
  int len = strlen(s);
  if (len == 1 && (*s == '+' || *s == '-' || *s == '*' || *s == '=')) return 1; // Correct char read
  for (int i = 0; i < len; i++)
    if (s[i] < '0' || s[i] > '9') return 0; // Illegal input
  return 2;                                 // Number read
}
int readProg() {
  FILE *pf = fopen("PF.txt", "r");
  char *t;
  if (!pf) return -1;
  do {
    readLine(pf, prog[cnt]);
    if (feof(pf)) {
      fclose(pf);
      return 0;
    }
    if (*prog[cnt]) cnt++;
  } while (1);
}
int splitString(const char *s, char r[8][32]) {
  int n = 0;
  while (*s) {
    while (*s && (*s == ' ' || *s == '\t')) s++;
    if (*s) {
      int i = 0;
      while (*s && *s != ' ' && *s != '\t') {
        r[n][i++] = (*s > 'Z' ? *s - 0x20 : *s);
        s++;
      }
      r[n][i] = 0;
      n++;
    }
  }
  return n;
}
void showPF() {
  if (!TRACE) return;
  if (charIn) fprintf(stderr, "IN=%c, ", PF.IN);
  else fprintf(stderr, "IN=%lld, ", PF.IN);
  fprintf(stderr, "A=%lld, B=%lld, C=%lld\n", PF.A, PF.B, PF.C);
}
int checkNumeric(const char *s, long long *r) {
  *r = 0;
  for (int i = 0; s[i]; i++) {
    if (i >= 18) return 0;
    if (s[i] < '0' || s[i] > '9') return 0;
    *r = 10 * *r + s[i] - '0';
  }
  return 1;
}
int checkReg(const char *s) {
  if (!strcmp(s, "IN")) return 1;
  if (!strcmp(s, "A")) return 2;
  if (!strcmp(s, "B")) return 3;
  if (!strcmp(s, "C")) return 4;
  return 0;
}
int READINT(int parCnt, const char p[8][32]) {
  if (parCnt > 1) return -1; // Command has no params
  char in[256];
  long long r = 0;
  if (readNext(stdin, in) != 2) {printf("1");return -2;} // Wrong input
  if (!checkNumeric(in, &r)) {printf("2");return -2;}    // Wrong input
  PF.IN = r;
  charIn = 0;
  currRow++;
  return 0;
}
int READCHAR(int parCnt, const char p[8][32]) {
  if (parCnt > 1) return -1; // Command has no params
  char c[256];
  if (readNext(stdin, c) != 1) {printf("3");return -2;} // Wrong input
  PF.IN = *c;
  charIn = 1;
  currRow++;
  return 0;
}
int IF(int parCnt, const char p[8][32]) {
  if (parCnt != 4) return -3;        // Wrong format
  if (strcmp(p[2], "IS")) return -3; // Wrong format
  int n = checkReg(p[1]);
  long long t;
  if (!n) return -3; // Wrong format
  if (n == 1) {
    if (charIn) {
      if (*p[3] != '+' && *p[3] != '-' && *p[3] != '*' && *p[3] != '=') return -4; // Invalid compare
      if (PF.IN == *p[3]) {
        currRow++;
        return 0;
      } // Correct TRUE
    } else {
      if (!checkNumeric(p[3], &t)) return -5; // Wrong number
      if (PF.IN == t) {
        currRow++;
        return 0;
      } // Correct TRUE
    }
  }
  if (n > 1) {
    if (!checkNumeric(p[3], &t)) return -5; // Wrong number
    switch (n) {
    case 2: {
      if (PF.A == t) {
        currRow++;
        return 0;
      } // Correct TRUE
      break;
    }
    case 3: {
      if (PF.B == t) {
        currRow++;
        return 0;
      } // Correct TRUE
      break;
    }
    case 4: {
      if (PF.C == t) {
        currRow++;
        return 0;
      }
    } // Correct TRUE
    }
  }
  // Correct FALSE: Find corresponding ENDIF
  n = 0;
  char row[8][32];
  for (int i = currRow + 1; i < cnt; i++) {
    int t = splitString(prog[i], row);
    int c = getInstrNo(row[0]);
    if (c == 2) {
      n++;
      continue;
    }
    if (c == 3) {
      if (!n) {
        currRow = i;
        return 0;
      }
      n--;
    }
  }
  return -3; // Should not happen
}
int ENDIF(int parCnt, const char p[8][32]) {
  if (parCnt > 1) return -1; // Command has no params
  currRow++;
  return 0;
}
int STORE(int parCnt, const char p[8][32]) {
  if (parCnt != 3) return -3; // Wrong format
  int r = checkReg(p[2]);
  if (!r) return -3;
  if (r == 1) return -6;
  long long t;
  if (!checkNumeric(p[1], &t)) return -5;
  switch (r) {
  case 2: {
    PF.A = t;
    break;
  }
  case 3: {
    PF.B = t;
    break;
  }
  case 4: PF.C = t;
  }
  currRow++;
  return 0;
}
int COPY(int parCnt, const char p[8][32]) {
  if (parCnt != 3) return -3; // Wrong format
  int r1 = checkReg(p[1]);
  if (!r1) return -3;
  int r2 = checkReg(p[2]);
  if (!r2) return -3;
  if (r2 == 1) return -6;
  if (r1 == 1 && charIn) return -7;
  switch (r1) {
  case 1: {
    switch (r2) {
    case 2: {
      PF.A = PF.IN;
      break;
    }
    case 3: {
      PF.B = PF.IN;
      break;
    }
    case 4: PF.C = PF.IN;
    }
    break;
  }
  case 2: {
    switch (r2) {
    case 2: break;
    case 3: {
      PF.B = PF.A;
      break;
    }
    case 4: PF.C = PF.A;
    }
    break;
  }
  case 3: {
    switch (r2) {
    case 2: {
      PF.A = PF.B;
      break;
    }
    case 3: break;
    case 4: PF.C = PF.B;
    }
    break;
  }
  case 4: {
    switch (r2) {
    case 2: {
      PF.A = PF.C;
      break;
    }
    case 3: {
      PF.B = PF.C;
      break;
    }
    }
    break;
  }
  }
  currRow++;
  return 0;
}
int ADD(int parCnt, const char p[8][32]) {
  if (parCnt != 3) return -3; // Wrong format
  int r1 = checkReg(p[1]);
  if (!r1) return -3;
  int r2 = checkReg(p[2]);
  if (!r2) return -3;
  if (r2 == 1) return -6;
  if (r1 == 1 && charIn) return -7;
  switch (r1) {
  case 1: {
    switch (r2) {
    case 2: {
      PF.A += PF.IN;
      break;
    }
    case 3: {
      PF.B += PF.IN;
      break;
    }
    case 4: PF.C += PF.IN;
    }
    break;
  }
  case 2: {
    switch (r2) {
    case 2: {
      PF.A += PF.A;
      break;
    }
    case 3: {
      PF.B += PF.A;
      break;
    }
    case 4: PF.C += PF.A;
    }
    break;
  }
  case 3: {
    switch (r2) {
    case 2: {
      PF.A += PF.B;
      break;
    }
    case 3: {
      PF.B += PF.B;
      break;
    }
    case 4: PF.C += PF.B;
    }
    break;
  }
  case 4: {
    switch (r2) {
    case 2: {
      PF.A += PF.C;
      break;
    }
    case 3: {
      PF.B += PF.C;
      break;
    }
    case 4: PF.C += PF.C;
    }
    break;
  }
  }
  currRow++;
  return 0;
}
int SUB(int parCnt, const char p[8][32]) {
  if (parCnt != 3) return -3; // Wrong format
  int r1 = checkReg(p[1]);
  if (!r1) return -3;
  int r2 = checkReg(p[2]);
  if (!r2) return -3;
  if (r2 == 1) return -6;
  if (r1 == 1 && charIn) return -7;
  switch (r1) {
  case 1: {
    switch (r2) {
    case 2: {
      PF.A -= PF.IN;
      break;
    }
    case 3: {
      PF.B -= PF.IN;
      break;
    }
    case 4: PF.C -= PF.IN;
    }
    break;
  }
  case 2: {
    switch (r2) {
    case 2: {
      PF.A -= PF.A;
      break;
    }
    case 3: {
      PF.B -= PF.A;
      break;
    }
    case 4: PF.C -= PF.A;
    }
    break;
  }
  case 3: {
    switch (r2) {
    case 2: {
      PF.A -= PF.B;
      break;
    }
    case 3: {
      PF.B -= PF.B;
      break;
    }
    case 4: PF.C -= PF.B;
    }
    break;
  }
  case 4: {
    switch (r2) {
    case 2: {
      PF.A -= PF.C;
      break;
    }
    case 3: {
      PF.B -= PF.C;
      break;
    }
    case 4: PF.C -= PF.C;
    }
    break;
  }
  }
  currRow++;
  return 0;
}
int MUL(int parCnt, const char p[8][32]) {
  if (parCnt != 3) return -3; // Wrong format
  int r1 = checkReg(p[1]);
  if (!r1) return -3;
  int r2 = checkReg(p[2]);
  if (!r2) return -3;
  if (r2 == 1) return -6;
  if (r1 == 1 && charIn) return -7;
  switch (r1) {
  case 1: {
    switch (r2) {
    case 2: {
      PF.A *= PF.IN;
      break;
    }
    case 3: {
      PF.B *= PF.IN;
      break;
    }
    case 4: PF.C *= PF.IN;
    }
    break;
  }
  case 2: {
    switch (r2) {
    case 2: {
      PF.A *= PF.A;
      break;
    }
    case 3: {
      PF.B *= PF.A;
      break;
    }
    case 4: PF.C *= PF.A;
    }
    break;
  }
  case 3: {
    switch (r2) {
    case 2: {
      PF.A *= PF.B;
      break;
    }
    case 3: {
      PF.B *= PF.B;
      break;
    }
    case 4: PF.C *= PF.B;
    }
    break;
  }
  case 4: {
    switch (r2) {
    case 2: {
      PF.A *= PF.C;
      break;
    }
    case 3: {
      PF.B *= PF.C;
      break;
    }
    case 4: PF.C *= PF.C;
    }
    break;
  }
  }
  currRow++;
  return 0;
}
int REPEAT(int parCnt, const char p[8][32]) {
  if (parCnt > 1) return -1; // Command has no params
  currRow++;
  return 0;
}
int LOOP(int parCnt, const char p[8][32]) {
  if (parCnt > 1) return -1; // Command has no params
  // Find corresponding REPEAT
  int n = 0;
  char row[8][32];
  for (int i = currRow - 1; i >= 0; i--) {
    int t = splitString(prog[i], row);
    int c = getInstrNo(row[0]);
    if (c == 9) {
      if (!n) {
        currRow = i;
        return 0;
      }
      n--;
    }
    if (c == 10) {
      n++;
      continue;
    }
  }
  return -3; // Should not happen
  return 0;
}
int STOP(int parCnt, const char p[8][32]) {
  if (parCnt > 1) return -1; // Command has no params
  return -10;
}
int (*instr[12])(int parCnt, const char p[8][32]) = {READINT, READCHAR, IF, ENDIF, STORE, COPY, ADD, SUB, MUL, REPEAT, LOOP, STOP};
int checkStruct() {
  int n = 0, k = 0;
  char row[8][32];
  for (int i = 0; i < cnt; i++) {
    int t = splitString(prog[i], row);
    if (!t) continue;
    switch (getInstrNo(row[0])) {
    case -1: {
      printf("%s\n", prog[i]);
      return -1;
    } // Invalid operation
    case 2: {
      n++;
      break;
    } // IF found
    case 3: {
      n--;
      if (n < 0) {
        printf("Line %d:\n", i + 1);
        return -2;
      } // ENDIF without IF
      break;
    }
    case 9: {
      k++;
      break;
    } // REPEAT found
    case 10: {
      k--;
      if (k < 0) {
        printf("Line %d:\n", i + 1);
        return -3;
      } // LOOP without REPEAT
      break;
    }
    }
  }
  if (n > 0) return -4; // IF without ENDIF
  if (k > 0) return -5; // REPEAT without LOOP
  return 0;             // Correct
}
int interpretRow(const char *s) {
  char row[8][32];
  int n = splitString(s, row);
  if (!n) return 1;
  if (TRACE) {
    fprintf(stderr, "Now executing: ");
    for (int i = 0; i < n; i++) fprintf(stderr, "%s ", row[i]);
    fprintf(stderr, "\n");
  }
  int No = getInstrNo(row[0]);
  if (No < 0) {
    fprintf(stderr, "Illegal instruction\n");
    return 0;
  }
  switch (instr[No](n, row)) {
  case 0: {
    showPF();
    return 1;
  }
  case -10: {
    showPF();
    return 2;
  }
  case -1: {
    fprintf(stderr, "Command has no parameters\n");
    break;
  }
  case -2: {
    fprintf(stderr, "Wrong input\n");
    break;
  }
  case -3: {
    fprintf(stderr, "Wrong format\n");
    break;
  }
  case -4: {
    fprintf(stderr, "Invalid comparison\n");
    break;
  }
  case -5: {
    fprintf(stderr, "Wrong number\n");
    break;
  }
  case -6: {
    fprintf(stderr, "Invalid register use\n");
    break;
  }
  case -7: {
    fprintf(stderr, "Invalid assignment\n");
    break;
  }
  }
  return 0;
}
int main() {
  char b[64];
  switch (readProg()) {
  case -1: {
    fprintf(stderr, "File PF.txt not found\n");
    return 0;
  }
  case -2: {
    fprintf(stderr, "File PF.txt error\n");
    return 0;
  }
  }
  switch (checkStruct()) {
  case -1: {
    fprintf(stderr, "Invalid instruction found\n");
    return 0;
  }
  case -2: {
    fprintf(stderr, "ENDIF without IF\n");
    return 0;
  }
  case -3: {
    fprintf(stderr, "LOOP without REPEAT\n");
    return 0;
  }
  case -4: {
    fprintf(stderr, "IF without ENDIF\n");
    return 0;
  }
  case -5: {
    fprintf(stderr, "REPEAT without LOOP\n");
    return 0;
  }
  }
  PF.IN = PF.A = PF.B = PF.C = 0;
  if (TRACE) fprintf(stderr, "Start execution\n");
  showPF();
  do {
    if (currRow >= cnt) {
      fprintf(stderr, "Missing line\n");
      return 0;
    }
    int n = interpretRow(prog[currRow]);
    if (n == 2) {
      // printf("OK\n=%lld\n", PF.A);
      printf("%lld\n", PF.A);
      return 0;
    }
    if (!n) return 0;
  } while (1);

  return 0;
}
