import { useState } from "react";
import "./DiscountCalculator.css";

// Справочник категорий
const CATEGORIES = [
  { id: "electronics", label: "Электроника", discount: 5 },
  { id: "clothing", label: "Одежда", discount: 15 },
  { id: "groceries", label: "Продукты", discount: 10 },
  { id: "books", label: "Книги", discount: 20 },
  { id: "other", label: "Другое", discount: 0 },
];

const VAT_RATE = 0.22;
const PROMO_CODES = { WELCOME10: 10 }; // промокод → процент скидки
const MAX_HISTORY = 5;

// Формат в рублях
function formatRub(value) {
  return (
    value.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₽"
  );
}

// Создаёт новый товар с уникальным id
let nextId = 2;
function createItem() {
  return { id: nextId++, price: "", category: "electronics" };
}

function DiscountCalculator() {
  // --- Состояния ---
  const [items, setItems] = useState([
    { id: 1, price: "", category: "electronics" },
  ]);
  const [promoCode, setPromoCode] = useState("");
  const [useCustomDiscount, setUseCustomDiscount] = useState(false);
  const [customDiscount, setCustomDiscount] = useState(10); // 0–50
  const [useVat, setUseVat] = useState(true);
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  // Промокод: если введён WELCOME10 — +10%
  const promoPercent = PROMO_CODES[promoCode.trim().toUpperCase()] || 0;
  const promoApplied = promoPercent > 0;

  // ---------- Обработчики товаров ----------
  function handlePriceChange(id, value) {
    // разрешаем "", цифры, одну точку
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, price: value } : it))
      );
      setError("");
      setCalculated(false);
    }
  }

  function handleCategoryChange(id, value) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, category: value } : it))
    );
    setCalculated(false);
  }

  function addItem() {
    setItems((prev) => [...prev, createItem()]);
    setCalculated(false);
  }

  function removeItem(id) {
    if (items.length === 1) return; // хотя бы один товар
    setItems((prev) => prev.filter((it) => it.id !== id));
    setCalculated(false);
  }

  // ---------- Кнопки ----------
  function handleCalculate() {
    // Валидация всех товаров
    for (const it of items) {
      if (!it.price.trim()) {
        setError("Введите цену для всех товаров");
        setCalculated(false);
        return;
      }
      const n = parseFloat(it.price);
      if (isNaN(n) || n <= 0) {
        setError("Цена должна быть положительным числом");
        setCalculated(false);
        return;
      }
    }
    setError("");

    // Считаем итог
    let grandTotal = 0;
    items.forEach((it) => {
      const numPrice = parseFloat(it.price);
      const cat = CATEGORIES.find((c) => c.id === it.category);
      const baseDiscount = useCustomDiscount
        ? customDiscount
        : cat?.discount ?? 0;
      const totalDiscount = Math.min(baseDiscount + promoPercent, 100);
      const priceAfterDiscount = numPrice * (1 - totalDiscount / 100);
      const vatAmount = useVat ? priceAfterDiscount * VAT_RATE : 0;
      grandTotal += priceAfterDiscount + vatAmount;
    });

    setCalculated(true);

    // Сохраняем в историю (последние 5)
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      itemsCount: items.length,
      total: grandTotal,
    };
    setHistory((prev) => [record, ...prev].slice(0, MAX_HISTORY));
  }

  function handleReset() {
    setItems([{ id: 1, price: "", category: "electronics" }]);
    nextId = 2;
    setPromoCode("");
    setUseCustomDiscount(false);
    setCustomDiscount(10);
    setUseVat(true);
    setCalculated(false);
    setError("");
  }

  function clearHistory() {
    setHistory([]);
  }

  // ---------- Результаты по каждому товару ----------
  const itemResults = items.map((it) => {
    const numPrice = parseFloat(it.price) || 0;
    const cat = CATEGORIES.find((c) => c.id === it.category);
    const baseDiscount = useCustomDiscount
      ? customDiscount
      : cat?.discount ?? 0;
    const totalDiscount = Math.min(baseDiscount + promoPercent, 100);
    const discountAmount = numPrice * (totalDiscount / 100);
    const priceAfterDiscount = numPrice - discountAmount;
    const vatAmount = useVat ? priceAfterDiscount * VAT_RATE : 0;
    const itemTotal = priceAfterDiscount + vatAmount;

    return {
      ...it,
      catLabel: cat?.label ?? "—",
      baseDiscount,
      totalDiscount,
      discountAmount,
      priceAfterDiscount,
      vatAmount,
      itemTotal,
    };
  });

  const grandDiscount = itemResults.reduce((s, r) => s + r.discountAmount, 0);
  const grandVat = itemResults.reduce((s, r) => s + r.vatAmount, 0);
  const grandAfterDiscount = itemResults.reduce(
    (s, r) => s + r.priceAfterDiscount,
    0
  );
  const grandTotal = itemResults.reduce((s, r) => s + r.itemTotal, 0);
  const grandOriginal = itemResults.reduce(
    (s, r) => s + (parseFloat(r.price) || 0),
    0
  );

  return (
    <div className="calculator-wrapper">
      <h2 className="calculator-title">Калькулятор скидок</h2>

      {/* --- Товары --- */}
      {items.map((it, idx) => (
        <div className="item-card" key={it.id}>
          <div className="item-card__head">
            <span className="item-card__title">Товар #{idx + 1}</span>
            {items.length > 1 && (
              <button
                type="button"
                className="item-card__remove"
                onClick={() => removeItem(it.id)}
              >
                Удалить
              </button>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor={`price-${it.id}`}>
              Цена товара
            </label>
            <input
              id={`price-${it.id}`}
              type="text"
              inputMode="decimal"
              className={
                "field__input" + (error ? " field__input--error" : "")
              }
              value={it.price}
              onChange={(e) => handlePriceChange(it.id, e.target.value)}
              placeholder="Например: 1000"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor={`cat-${it.id}`}>
              Категория товара
            </label>
            <select
              id={`cat-${it.id}`}
              className="field__input field__select"
              value={it.category}
              onChange={(e) => handleCategoryChange(it.id, e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} — скидка {c.discount}%
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <button type="button" className="btn btn--ghost" onClick={addItem}>
        + Добавить товар
      </button>

      {/* --- Промокод --- */}
      <div className="field">
        <label className="field__label" htmlFor="promo">
          Промокод
        </label>
        <input
          id="promo"
          type="text"
          className="field__input"
          value={promoCode}
          onChange={(e) => {
            setPromoCode(e.target.value);
            setCalculated(false);
          }}
          placeholder="Например: WELCOME10"
        />
        {promoApplied && (
          <span className="field__hint field__hint--ok">
            Промокод применён: +{promoPercent}%
          </span>
        )}
        {promoCode.trim() && !promoApplied && (
          <span className="field__hint field__hint--err">
            Неизвестный промокод
          </span>
        )}
      </div>

      {/* --- Кастомная скидка --- */}
      <div className="field field--custom">
        <label className="field__checkbox-label">
          <input
            type="checkbox"
            checked={useCustomDiscount}
            onChange={(e) => {
              setUseCustomDiscount(e.target.checked);
              setCalculated(false);
            }}
          />
          <span>Использовать кастомную скидку (заменяет скидку категории)</span>
        </label>

        <div className="slider-row">
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={customDiscount}
            onChange={(e) => {
              setCustomDiscount(Number(e.target.value));
              setCalculated(false);
            }}
            disabled={!useCustomDiscount}
            className="slider"
          />
          <span className="slider-value">{customDiscount}%</span>
        </div>
      </div>

      {/* --- НДС --- */}
      <div className="field field--custom">
        <label className="field__checkbox-label">
          <input
            type="checkbox"
            checked={useVat}
            onChange={(e) => {
              setUseVat(e.target.checked);
              setCalculated(false);
            }}
          />
          <span>Начислять НДС 22%</span>
        </label>
      </div>

      {/* --- Ошибка --- */}
      {error && <div className="field__error">{error}</div>}

      {/* --- Кнопки --- */}
      <div className="actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleCalculate}
        >
          Рассчитать
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleReset}
        >
          Сбросить
        </button>
      </div>

      {/* --- Результаты --- */}
      {calculated && !error && (
        <div className="results">
          <h3 className="results__title">Результат расчёта</h3>

          {itemResults.map((r, idx) => (
            <div className="results__item" key={r.id}>
              <div className="results__item-head">
                Товар #{idx + 1} · {r.catLabel}
              </div>
              <table className="results__table">
                <tbody>
                  <tr>
                    <td>Исходная цена</td>
                    <td className="results__value">
                      {formatRub(parseFloat(r.price) || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td>Скидка ({r.totalDiscount}%)</td>
                    <td className="results__value results__value--discount">
                      − {formatRub(r.discountAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td>Цена после скидки</td>
                    <td className="results__value">
                      {formatRub(r.priceAfterDiscount)}
                    </td>
                  </tr>
                  {useVat && (
                    <tr>
                      <td>НДС 22%</td>
                      <td className="results__value">
                        + {formatRub(r.vatAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}

          <table className="results__table results__table--total">
            <tbody>
              <tr>
                <td>Общая исходная сумма</td>
                <td className="results__value">{formatRub(grandOriginal)}</td>
              </tr>
              <tr>
                <td>Общая скидка</td>
                <td className="results__value results__value--discount">
                  − {formatRub(grandDiscount)}
                </td>
              </tr>
              <tr>
                <td>Сумма без НДС</td>
                <td className="results__value">
                  {formatRub(grandAfterDiscount)}
                </td>
              </tr>
              {useVat && (
                <tr>
                  <td>НДС</td>
                  <td className="results__value">
                    + {formatRub(grandVat)}
                  </td>
                </tr>
              )}
              <tr className="results__row--grand">
                <td>Итого к оплате</td>
                <td className="results__value">{formatRub(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* --- История --- */}
      {history.length > 0 && (
        <div className="history">
          <div className="history__head">
            <h3 className="history__title">История (последние 5)</h3>
            <button
              type="button"
              className="history__clear"
              onClick={clearHistory}
            >
              Очистить
            </button>
          </div>
          <ul className="history__list">
            {history.map((h) => (
              <li className="history__item" key={h.id}>
                <span className="history__date">{h.date}</span>
                <span className="history__meta">
                  {h.itemsCount} товар(ов)
                </span>
                <span className="history__total">{formatRub(h.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DiscountCalculator;