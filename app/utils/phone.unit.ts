/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest"
import { formatPhoneNumber, unformatPhoneNumber } from "./phone"

describe("formatPhoneNumber", () => {
	it("formats valid 9 digits correctly", () => {
		expect(formatPhoneNumber("123456789")).toBe("123-456-789")
	})

	it("formats another valid 9 digits correctly", () => {
		expect(formatPhoneNumber("987654321")).toBe("987-654-321")
	})

	it("formats numbers starting with zeros", () => {
		expect(formatPhoneNumber("001234567")).toBe("001-234-567")
		expect(formatPhoneNumber("000000000")).toBe("000-000-000")
	})

	it("formats different valid 9-digit numbers", () => {
		expect(formatPhoneNumber("111222333")).toBe("111-222-333")
		expect(formatPhoneNumber("555666777")).toBe("555-666-777")
		expect(formatPhoneNumber("444555666")).toBe("444-555-666")
	})

	it("throws error for invalid length (too short)", () => {
		expect(() => formatPhoneNumber("12345")).toThrow(
			"Phone number must be exactly 9 digits",
		)
		expect(() => formatPhoneNumber("1234567")).toThrow(
			"Phone number must be exactly 9 digits",
		)
	})

	it("throws error for invalid length (too long)", () => {
		expect(() => formatPhoneNumber("1234567890")).toThrow(
			"Phone number must be exactly 9 digits",
		)
		expect(() => formatPhoneNumber("12345678901")).toThrow(
			"Phone number must be exactly 9 digits",
		)
	})

	it("throws error for empty string", () => {
		expect(() => formatPhoneNumber("")).toThrow(
			"Phone number must be exactly 9 digits",
		)
	})

	it("throws error for null or undefined", () => {
		expect(() => formatPhoneNumber(null as any)).toThrow(
			"Phone number must be exactly 9 digits",
		)
		expect(() => formatPhoneNumber(undefined as any)).toThrow(
			"Phone number must be exactly 9 digits",
		)
	})

	it("rejects formatted input (expects unformatted 9 digits)", () => {
		expect(() => formatPhoneNumber("123-456-789")).toThrow(
			"Phone number must be exactly 9 digits",
		)
	})
})

describe("unformatPhoneNumber", () => {
	it("removes dashes from formatted phone", () => {
		expect(unformatPhoneNumber("123-456-789")).toBe("123456789")
	})

	it("handles already unformatted input", () => {
		expect(unformatPhoneNumber("123456789")).toBe("123456789")
	})

	it("removes all non-digit characters", () => {
		expect(unformatPhoneNumber("123-456-789 ext.123")).toBe("123456789123")
		expect(unformatPhoneNumber("(123) 456-789")).toBe("123456789")
		expect(unformatPhoneNumber("123.456.789")).toBe("123456789")
	})

	it("handles empty string", () => {
		expect(unformatPhoneNumber("")).toBe("")
	})

	it("handles string with spaces", () => {
		expect(unformatPhoneNumber("123 456 789")).toBe("123456789")
	})

	it("removes letters and special characters", () => {
		expect(unformatPhoneNumber("123-abc-789")).toBe("123789")
		expect(unformatPhoneNumber("123@456#789")).toBe("123456789")
	})

	it("handles various whitespace characters", () => {
		expect(unformatPhoneNumber("123\t456\t789")).toBe("123456789")
		expect(unformatPhoneNumber("123\n456\n789")).toBe("123456789")
	})

	it("handles mixed formatted and unformatted input", () => {
		expect(unformatPhoneNumber("123-456789")).toBe("123456789")
		expect(unformatPhoneNumber("123456-789")).toBe("123456789")
	})

	it("handles phone with trailing/leading spaces", () => {
		expect(unformatPhoneNumber(" 123-456-789 ")).toBe("123456789")
		expect(unformatPhoneNumber("  123456789  ")).toBe("123456789")
	})

	it("removes country code prefix", () => {
		expect(unformatPhoneNumber("+48 123-456-789")).toBe("48123456789")
	})
})

describe("formatPhoneNumber and unformatPhoneNumber - round trip", () => {
	it("round trip: format then unformat returns original", () => {
		const original = "123456789"
		const formatted = formatPhoneNumber(original)
		const unformatted = unformatPhoneNumber(formatted)
		expect(unformatted).toBe(original)
	})

	it("round trip: unformat then format (if valid length)", () => {
		const input = "123-456-789"
		const unformatted = unformatPhoneNumber(input)
		const formatted = formatPhoneNumber(unformatted)
		expect(formatted).toBe(input)
	})

	it("handles multiple format/unformat cycles", () => {
		let phone = "987654321"
		phone = formatPhoneNumber(phone) // "987-654-321"
		phone = unformatPhoneNumber(phone) // "987654321"
		phone = formatPhoneNumber(phone) // "987-654-321"
		phone = unformatPhoneNumber(phone) // "987654321"
		expect(phone).toBe("987654321")
	})
})

describe("phone utilities - Polish phone number patterns", () => {
	it("handles common Polish mobile prefixes", () => {
		expect(formatPhoneNumber("501234567")).toBe("501-234-567")
		expect(formatPhoneNumber("601234567")).toBe("601-234-567")
		expect(formatPhoneNumber("721234567")).toBe("721-234-567")
		expect(formatPhoneNumber("881234567")).toBe("881-234-567")
	})

	it("handles Polish landline patterns", () => {
		expect(formatPhoneNumber("123456789")).toBe("123-456-789")
		expect(formatPhoneNumber("221234567")).toBe("221-234-567")
	})
})
