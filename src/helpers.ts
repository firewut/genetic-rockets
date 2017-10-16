export function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export interface Dictionary<T> {
    [K: string]: T;
}

export function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandomFromArray(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}
