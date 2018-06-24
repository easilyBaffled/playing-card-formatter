import React from "react";
import ReactDOM from "react-dom";
import is from "@sindresorhus/is";
import { reduce, pipe, map, ifElse, identity, flatten } from "ramda";
import { re } from "re-template-tag";

import "./styles.css";

console.ident = val => (console.log(val), val);
document.getElementById("id").addEventListener("click", () => window.print());

var strToConsumingRegex = str =>
  new RegExp(str.includes("(") ? str : `(${str})`);

var consumeKIDict = keywordIconDict => iconWrapper => str =>
  Object.entries(keywordIconDict).reduce(
    (acc, [keyword, icon]) =>
      acc.replace(strToConsumingRegex(keyword), `$1${iconWrapper(icon)}`),
    str
  );

var addIcons = consumeKIDict({ "([aeiou])": "👍", b: "⚡️" })(
  str => `(${str}) `
);

const toArray = (val = []) => [].concat(val);

const replaceKeyword = (keyword, replacement) => str =>
  ifElse(
    arr => arr.length > 1,
    splitStr =>
      splitStr.reduce((acc, part) =>
        toArray(acc)
          .concat(replacement)
          .concat(part)
      ),
    identity
  )(str.split(keyword));

const replacementReucer = (str, [keyword, replacement]) =>
  pipe(
    toArray,
    map(ifElse(is.string, replaceKeyword(keyword, replacement), identity)),
    flatten
  )(str);

const addSyntaxHighlighting = keywordDict => str =>
  Object.entries(keywordDict).reduce(replacementReucer, str);

const highlightKeywords = addSyntaxHighlighting({
  Swap: <span className="keyword swap">Swap</span>,
  Move: <span className="keyword move">Move</span>,
  Freeze: <span className="keyword freeze">Freeze</span>,
  swap: <span className="keyword swap">swap</span>,
  move: <span className="keyword move">move</span>,
  freeze: <span className="keyword freeze">freeze</span>,
  "this chip": <span className="target this">this chip</span>,
  "adjacent chips": <span className="target adjacent ">adjacent chips</span>
  // "(d+)": <span className="keyword freeze">Freeze</span>
});

const cardText = `
Swap 2 chips that are at most 2 spaces away from each other
Swap 2 chips that are at most 3 spaces away from each other
Swap 2 chips that are at most 4 spaces away from each other
Swap any two chips on the board

Move 2 chips that are at most 2 spaces away from each other
Move 2 chips that are at most 3 spaces away from each other
Move 2 chips that are at most 4 spaces away from each other
Swap 2 effect
Move an effect to an adjacent space
Move an effect to a space at most 2 spaces away
Move an effect to a space at most 3 spaces away
Move an effect to any space on the board that does not already have an effect

Freeze an effect until the start of your next turn
Freeze an effect until the end of your next turn
Freeze an effect until the end of your turn
Freeze an chip until the start of your next turn
Freeze an chip until the end of your next turn
Freeze an chip until the end of your turn

If this chip is cleared you may collect an additional chip adjacent to it
If this chip is in a matching set, it is not cleared from the board
If this chip is in a matching set, the other chips are not cleared from the board

Rotate the adjacent chips around this chip 1 position right
Rotate the adjacent chips around this chip 1 position left

When this chip is cleared you may fill it's spot with any color chip.
Select a color when this chip is cleared you may fill it's spot with that color chip.
If this chip is cleared you may move any chips adjacent to it that were not cleared into the cleared spaces

When this chip is cleared freeze all chips in the same row
When this chip is cleared freeze all chips in the same column
`;

var convertToCards = cardText =>
  cardText
    .trim()
    .split("\n")
    .filter(v => v)
    .map(highlightKeywords)
    .map(arr => <p className="card-body">{arr}</p>);

// convertToCards(str)

// TODO: Isolate the React portion as much as possible so that it can easily be ported

const Page = ({ style = {}, className = "", children }) => (
  <div className={"page flexContainer" + className} style={style}>
    {children}
  </div>
);

const Card = ({ size, children, rightBorder, bottomBorder }) => (
  <div
    className={
      "card " +
      (rightBorder ? "rightBorder " : "") +
      (bottomBorder ? "bottomBorder" : "")
    }
    style={{
      height: size.height + "in",
      width: size.width + "in"
    }}
  >
    {children}
  </div>
);

const cardSize = {
  height: 2.5,
  width: 1.6
};

const pageSize = {
  // Accounting for padding
  height: 10.5,
  width: 8
};

const cardsPerPage =
  Math.floor(pageSize.height / cardSize.height) *
  Math.floor(pageSize.width / cardSize.width);
const cardsInRow = Math.floor(pageSize.width / cardSize.width);
const isLastInRow = index => !((index + 1) % cardsInRow);

const data = convertToCards(cardText);

const numberOfPages = Math.ceil(data.length / cardsPerPage);
const dataPerPage = Array.from({ length: numberOfPages }, (_, i) =>
  data.slice(i * cardsPerPage, i * cardsPerPage + cardsPerPage)
);

const Pages = () => (
  <div>
    {dataPerPage.map((pageData, p) => (
      <Page key={p}>
        {pageData.map((data, i) => (
          <Card
            key={i}
            size={cardSize}
            rightBorder={isLastInRow(i)}
            bottomBorder={pageData.length - i <= cardsInRow}
          >
            {data}
          </Card>
        ))}
      </Page>
    ))}
  </div>
);

ReactDOM.render(<Pages />, document.getElementById("root"));
