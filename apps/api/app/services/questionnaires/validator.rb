# typed: false

# 問診の答えを確かめる。DB も時計も読まない
module Questionnaires
  module Validator
    MAX_TEXT = 1000

    module_function

    # questions は QuestionnaireQuestion の並び。answers は { 質問の id（文字）=> 値 }。
    # 値は、文章と選択なら文字、複数選択なら文字の並び。
    # 悪い所を、質問ごとに、まとめて返す（UserError の並び。field は "answers.<質問の id>"）
    def errors(questions, answers, submit:)
      questions.filter_map do |question|
        message = message_for(question, answers[question.id.to_s], submit: submit)
        UserError.new(code: "INVALID_INPUT", message: "#{question.label}: #{message}", field: "answers.#{question.id}") if message
      end
    end

    def message_for(question, value, submit:)
      if blank?(value)
        # 途中まで保存するときは、空でもよい。提出するときだけ、必須を確かめる
        return submit && question.required ? "答えを入れてください" : nil
      end

      case question.kind
      when "text"
        return "文字で入れてください" unless value.is_a?(String)

        "#{MAX_TEXT}文字までで入れてください" if value.length > MAX_TEXT
      when "single"
        "選択肢から選んでください" unless value.is_a?(String) && question.options.include?(value)
      when "multiple"
        "選択肢から選んでください" unless value.is_a?(Array) && value.uniq.size == value.size && (value - question.options).empty?
      end
    end

    # 空白だけの文章も、答えがないものとして扱う
    def blank?(value) = value.nil? || value == [] || (value.is_a?(String) && value.match?(/\A[[:space:]]*\z/))
  end
end
