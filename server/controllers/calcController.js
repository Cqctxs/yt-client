const mathjs = require("mathjs");
const config = {
  number: "Fraction",
};
const math = mathjs.create(mathjs.all, config);

const primes = require("../lib/primes");

const formatVector = ([x, y, z]) => {
  let displayX = "";
  let displayY = "";
  let displayZ = "";
  if (x.d === 1) {
    displayX = `${x.n * x.s}`;
  } else {
    displayX = `${x.n * x.s}/${x.d}`;
  }
  if (y.d === 1) {
    displayY = `${y.n * y.s}`;
  } else {
    displayY = `${y.n * y.s}/${y.d}`;
  }
  if (z.d === 1) {
    displayZ = `${z.n * z.s}`;
  } else {
    displayZ = `${z.n * z.s}/${z.d}`;
  }
  return `(${displayX}, ${displayY}, ${displayZ})`;
};

const formatCartesian = ([a, b, c], d) => {
  const lcm = math.lcm(a.d, math.lcm(b.d, math.lcm(c.d, d.d)));
  let newN = math.multiply([a, b, c], lcm);
  let newD = math.multiply(d, lcm);
  const gcd = math.gcd(newN[0].n, math.gcd(newN[1].n, math.gcd(newN[2].n, newD.n)));
  newN = math.divide(newN, gcd);
  newD = math.divide(newD, gcd);
  return `${newN[0].n}x + ${newN[1].n}y + ${newN[2].n}z - ${newD.n} = 0`;
};

const simplifyDirectionVector = ([x, y, z]) => {
  const lcm = math.lcm(x.d, math.lcm(y.d, z.d));
  const multipliedX = math.multiply(x, lcm);
  const multipliedY = math.multiply(y, lcm);
  const multipliedZ = math.multiply(z, lcm);
  const gcd = math.gcd(multipliedX.n, math.gcd(multipliedY.n, multipliedZ.n));
  const newX = math.divide(multipliedX, gcd);
  const newY = math.divide(multipliedY, gcd);
  const newZ = math.divide(multipliedZ, gcd);
  return [newX, newY, newZ];
};

const solveLine = ([x1, y1, z1], [ux, uy, uz], [x2, y2, z2], [vx, vy, vz]) => {
  const solution = math.lusolve(
    [
      [ux, -vx],
      [uy, -vy],
    ],
    [x2 - x1, y2 - y1]
  );
  return solution;
};

const simplifyRoot = (inRoot) => {
  let newRoot = inRoot;
  let outRoot = 1;
  let factors = new Array(4410).fill(0);
  let num = inRoot;
  let i = 0;
  let divisor = primes[0];

  while (num > 1) {
    if (num % divisor === 0) {
      factors[divisor]++;
      num /= divisor;
    } else {
      i++;
      divisor = primes[i];
    }
  }

  for (let i = 2; i < factors.length; i++) {
    if (factors[i] >= 2) {
      if (factors[i] % 2 === 0) {
        outRoot *= math.pow(i, factors[i] / 2);
        newRoot /= math.pow(i, factors[i]);
      } else {
        outRoot *= math.pow(i, (factors[i] - 1) / 2);
        newRoot /= math.pow(i, factors[i] - 1);
      }
    }
  }

  if (newRoot === 1) {
    return outRoot;
  } else if (outRoot === 1) {
    return `√${newRoot}`;
  } else {
    return `${outRoot}√${newRoot}`;
  }
};

const calc = async (req, res) => {
  const answers = [];

  const studentNum = req.body.studentNum;

  // Ensure studentNum is a string and split it into individual digits
  const num = studentNum.toString().split("").map(Number);

  // 1. Map the digits to the arrays A, B, and C using fractions
  const A = [
    math.fraction(num[0]),
    math.fraction(-num[1]),
    math.fraction(num[2]),
  ];
  const B = [
    math.fraction(-num[3]),
    math.fraction(num[4]),
    math.fraction(-num[5]),
  ];
  const C = [
    math.fraction(num[6]),
    math.fraction(-num[7]),
    math.fraction(num[8]),
  ];
  
  answers.push(`A${formatVector(A)}, B${formatVector(B)}, C${formatVector(C)}`);

  // 2. Find displacement vectors
  const AB = math.subtract(B, A);
  const BC = math.subtract(C, B);
  const AC = math.subtract(C, A);

  answers.push(`AB = ${formatVector(AB)}`);

  // 3. Find the perimeter of the triangle ABC
  const ABInRoot = math.square(AB[0]) + math.square(AB[1]) + math.square(AB[2]);
  const BCInRoot = math.square(BC[0]) + math.square(BC[1]) + math.square(BC[2]);
  const ACInRoot = math.square(AC[0]) + math.square(AC[1]) + math.square(AC[2]);

  answers.push(`Perimeter = ${simplifyRoot(ABInRoot)} + ${simplifyRoot(BCInRoot)} + ${simplifyRoot(ACInRoot)}`);

  // 4. Find angle A
  const angleA = math.round(math.unit(math.acos(math.dot(AB, AC) / (math.norm(AB) * math.norm(AC))), "rad").toNumber("deg"), 2);

  answers.push(`∠A = ${angleA}`);

  // 5. Area of triangle
  const ABxAC = math.divide(math.cross(AB, AC), 2);
  const areaInRoot = math.square(ABxAC[0]) + math.square(ABxAC[1]) + math.square(ABxAC[2]);

  answers.push(`Area = ${simplifyRoot(areaInRoot)}`);

  // 6. Volume OABC
  const volume = math.divide(math.abs(math.dot(math.cross(A, B), C)), 6);
  
  answers.push(`Volume = ${volume.n}/${volume.d}`);

  // 7. Median A
  const MBC = math.divide(math.add(B, C), 2);
  const dirCentroidA = simplifyDirectionVector(math.subtract(MBC, A));
  const medianA = `L1: ${formatVector(A)} + s${formatVector(
    dirCentroidA
  )}; s ∈ R`;

  // Median B
  const MAC = math.divide(math.add(A, C), 2);
  const dirCentroidB = simplifyDirectionVector(math.subtract(MAC, B));
  const medianB = `L2: ${formatVector(B)} + t${formatVector(
    dirCentroidB
  )}; t ∈ R`;

  // Median C
  const MAB = math.divide(math.add(A, B), 2);
  const dirCentroidC = simplifyDirectionVector(math.subtract(MAB, C));
  const medianC = `L3: ${formatVector(C)} + u${formatVector(
    dirCentroidC
  )}; u ∈ R`;

  answers.push(`Median from A: ${medianA}, Median from B: ${medianB}, Median from C: ${medianC}`);

  // 8. Centroid
  let sol = solveLine(A, dirCentroidA, B, dirCentroidB);
  let s = sol[0][0];
  let t = sol[1][0];
  const G = math.add(A, math.multiply(dirCentroidA, s));

  answers.push(`Centroid: G${formatVector(G)}`);

  // 9. Cartesian equation of plane ABC
  const n = math.cross(AB, AC);
  const D = math.dot(n, A);
  const plane = formatCartesian(n, D);

  answers.push(`π: ${plane}`);

  // 10. Distance from O to plane ABC
  const distNum = math.abs(math.dot(n, A));
  const distInRoot = math.square(n[0]) + math.square(n[1]) + math.square(n[2]);

  answers.push(`Distance from O to π: ${distNum}/${simplifyRoot(distInRoot)}`);

  // 11. Altitude from A to BC
  const dirPerpBC = simplifyDirectionVector(math.cross(n, BC));
  const altitudeA = `L4: ${formatVector(A)} + s${formatVector(
    dirPerpBC
  )}; s ∈ R`;

  // Altitude form B to AC
  const dirPerpAC = simplifyDirectionVector(math.cross(n, AC));
  const altitudeB = `L5: ${formatVector(B)} + t${formatVector(
    dirPerpAC
  )}; t ∈ R`;

  // Altitude from C to AB
  const dirPerpAB = simplifyDirectionVector(math.cross(n, AB));
  const altitudeC = `L6: ${formatVector(C)} + u${formatVector(
    dirPerpAB
  )}; u ∈ R`;

  answers.push(`Altitude from A: ${altitudeA}, Altitude from B: ${altitudeB}, Altitude from C: ${altitudeC}`);

  // 12. Orthrocenter
  sol = solveLine(A, dirPerpBC, B, dirPerpAC);
  s = sol[0][0];
  t = sol[1][0];
  const H = math.add(A, math.multiply(dirPerpBC, s));

  answers.push(`Orthocenter: H${formatVector(H)}`);

  // 13. Perpendicular bisector of BC
  const perpBisectorBC = `L7: ${formatVector(MBC)} + s${formatVector(
    dirPerpBC
  )}; s ∈ R`;

  // Perpendicular bisector of AC
  const perpBisectorAC = `L8: ${formatVector(MAC)} + t${formatVector(
    dirPerpAC
  )}; t ∈ R`;

  // Perpendicular bisector of AB
  const perpBisectorAB = `L9: ${formatVector(MAB)} + u${formatVector(
    dirPerpAB
  )}; u ∈ R`;

  answers.push(`Perpendicular bisector of BC: ${perpBisectorBC}, Perpendicular bisector of AC: ${perpBisectorAC}, Perpendicular bisector of AB: ${perpBisectorAB}`);

  // 14. Circumcenter
  sol = solveLine(MBC, dirPerpBC, MAC, dirPerpAC);
  s = sol[0][0];
  t = sol[1][0];
  const K = math.add(MBC, math.multiply(dirPerpBC, s));

  answers.push(`Circumcenter: K${formatVector(K)}`);

  // 15. Check relationship between G, H, and K
  const check = math.subtract(math.subtract(H, K), math.multiply(3, math.subtract(G, K)));
  if (check[0].n === 0 && check[1].n === 0 && check[2].n === 0) {
    answers.push("G, H, and K are collinear, KH - 3KG = 0");
  } else {
    answers.push("G, H, and K are not collinear");
  }
  
  // 16. Euler Line
  const dirEuler = simplifyDirectionVector(math.subtract(H, K));
  const euler = `L10: ${formatVector(G)} + s${formatVector(dirEuler)}; s ∈ R`;

  answers.push(`Euler Line: ${euler}`);

  res.json(answers);
};

module.exports = {
  calc,
};