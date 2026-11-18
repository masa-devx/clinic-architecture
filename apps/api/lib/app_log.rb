# ログの共通の出口。1行の JSON で出す。業務のコードから Rails.logger を直接呼ばない
# 渡すのは要約（ID など）だけ。名前・メールアドレス・パスワード・問診の中身は渡さない
module AppLog
  module_function

  def info(name, **summary)
    Rails.logger.info({ name: name, **summary }.to_json)
  end

  # omit_message: エラーの文に個人情報が入りうるとき（メールの送信の失敗など）に、文を出さない
  def error(name, err:, omit_message: false, **summary)
    formatted = format_error(err)
    formatted[:message] = "（出さない）" if omit_message
    Rails.logger.error({ name: name, **summary, err: formatted }.to_json)
  end

  # DB のエラーは2行目から値（DETAIL: Key (email)=(...)）が入るので、1行目だけを残す
  def format_error(err)
    { name: err.class.name, message: err.message.to_s.lines.first.to_s.strip, stack: Array(err.backtrace).first(15) }
  end
end
