import { render, fireEvent, waitFor } from "@testing-library/react";
import { toBeInTheDocument } from "@testing-library/jest-dom";
import RuleHeader from "./RuleHeader";
import api from "@/app/utils/api";

jest.mock("../../utils/api", () => ({
  updateRuleData: jest.fn(),
}));

describe("RuleHeader - doneEditingTitle", () => {
  const ruleInfoMock = { _id: "1", title: "Original Title", goRulesJSONFilename: "filename.json" };

  it("updates title on success", async () => {
    api.updateRuleData.mockResolvedValue({}); // Mock success
    const { getByLabelText, getByText } = render(<RuleHeader ruleInfo={ruleInfoMock} />);
    fireEvent.click(getByText("Original Title")); // Start editing
    fireEvent.change(getByLabelText("Edit title"), { target: { value: "New Title" } });
    fireEvent.blur(getByLabelText("Edit title")); // Done editing
    await waitFor(() => expect(getByText("New Title")).toBeInTheDocument());
  });

  it("reverts title on update failure", async () => {
    api.updateRuleData.mockRejectedValue(new Error("Failed to update")); // Mock failure
    const { getByLabelText, getByText } = render(<RuleHeader ruleInfo={ruleInfoMock} />);
    fireEvent.click(getByText("Original Title")); // Start editing
    fireEvent.change(getByLabelText("Edit title"), { target: { value: "Failed Title" } });
    fireEvent.blur(getByLabelText("Edit title")); // Done editing
    await waitFor(() => expect(getByText("Original Title")).toBeInTheDocument());
  });

  it("does nothing if title is unchanged", async () => {
    const { getByLabelText, getByText } = render(<RuleHeader ruleInfo={ruleInfoMock} />);
    fireEvent.click(getByText("Original Title")); // Start editing
    fireEvent.blur(getByLabelText("Edit title")); // Done editing without change
    await waitFor(() => expect(getByText("Original Title")).toBeInTheDocument());
  });
});
